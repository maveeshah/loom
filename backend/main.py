from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
import models
import glob
import yaml
import inspect
import importlib
import json
from datetime import datetime
from auth_utils import get_current_user, check_permissions
import auth_router
from pydantic import BaseModel, create_model
from typing import Any, Optional, Dict
import admin_router
import settings_router
from plugin_registry import registry

from settings import get_settings, Settings


def get_model_by_name(name: str):
    """Look up a SQLAlchemy model class by name case-insensitively."""
    for attr_name in dir(models):
        if attr_name.lower() == name.lower():
            model = getattr(models, attr_name)
            if inspect.isclass(model):
                return model
    raise HTTPException(status_code=404, detail=f"Module '{name}' not found")


def model_to_dict(instance) -> dict:
    """Serialize a SQLAlchemy model instance to a plain dict."""
    return {c.name: getattr(instance, c.name) for c in instance.__table__.columns}


def load_blueprints(settings: Settings) -> list[dict]:
    """
    Load all blueprint YAML files and return them as a list.

    Search paths are controlled by Settings.blueprint_paths, allowing the
    framework to combine core and plugin/tenant blueprints.
    """

    blueprints: list[dict] = []

    for root in settings.blueprint_paths:
        pattern = f"{root.rstrip('/')}" + "/*.yaml"
        for bp_path in glob.glob(pattern):
            with open(bp_path, "r") as f:
                bp = yaml.safe_load(f) or {}
                blueprints.append(bp)

    return blueprints


def create_pydantic_model_from_blueprint(blueprint: dict, is_update: bool = False) -> type[BaseModel]:
    """
    Dynamically generate a Pydantic model for validation and OpenAPI docs based on a YAML blueprint.
    If `is_update` is True, all fields become optional (like a PATCH operation).
    """
    model_name = blueprint.get("name", "UnknownModel").replace(" ", "")
    fields = blueprint.get("fields", [])

    # Map blueprint types to Python types
    type_mapping = {
        "String": str,
        "Integer": int,
        "Float": float,
        "Boolean": bool,
        "JSON": Dict[str, Any],
        "DateTime": datetime,
        "Date": datetime, # Simple approximation for date
    }

    model_fields = {}

    # Always allow an ID in update payloads just in case, though it's typically in the URL
    if is_update:
        model_fields["id"] = (Optional[int], None)

    for field in fields:
        f_name = field["name"]
        f_type_str = field.get("type", "String")
        py_type = type_mapping.get(f_type_str, Any)

        is_required = field.get("required", False)

        if is_update:
            # Everything is optional in a PUT/PATCH unless specifically needed
            model_fields[f_name] = (Optional[py_type], None)
        else:
            if is_required:
                model_fields[f_name] = (py_type, ...)
            else:
                default_val = field.get("default", None)
                if default_val == "now()":
                    default_val = None # We let the DB handle it
                model_fields[f_name] = (Optional[py_type], default_val)

    # Add foreign keys dynamically
    for assoc in blueprint.get("associations", []):
        if assoc.get("type") == "belongs_to":
            fk_name = assoc.get("foreign_key", f"{assoc.get('target', '').lower()}_id")
            if is_update:
                model_fields[fk_name] = (Optional[int], None)
            else:
                model_fields[fk_name] = (Optional[int], None)

    suffix = "Update" if is_update else "Create"
    return create_model(f"{model_name}{suffix}", **model_fields)


def log_audit(
    db: Session,
    model_name: str,
    record_id: int,
    action: str,
    changes: dict = None,
    actor: str = "System User",
):
    """Helper to save an audit log entry."""
    if model_name.lower() in ("auditlog", "comment"):
        return
    try:
        AuditModel = get_model_by_name("AuditLog")
        log = AuditModel(
            model_name=model_name,
            record_id=record_id,
            action=action,
            changes=changes, # Now passing dict directly as the column is JSON
            actor=actor,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
    except Exception as e:
        print(f"Failed to log audit: {e}")


def create_app(settings: Settings = None) -> FastAPI:
    if settings is None:
        settings = get_settings()

    app = FastAPI(title=settings.app_title)

    # Configure CORS using central settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.allowed_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    core_router = APIRouter(prefix=settings.api_prefix)

    # Discover Backend Plugins
    registry.discover_plugins(settings.plugin_paths)

    # Include Authentication Router
    app.include_router(auth_router.router, prefix="/v1")
    app.include_router(admin_router.router, prefix="/v1")
    app.include_router(settings_router.router, prefix="/v1")

    # Register Backend Plugin Routers
    for plugin_name, manifest in registry.plugins.items():
        if manifest.router:
            core_router.include_router(manifest.router)
            print(f"Loaded plugin router for {plugin_name}")

    # ─── Custom Routers (Overrides) ──────────────────────────────────────
    # Load any custom router overrides specifically mentioned in blueprints
    for bp in load_blueprints(settings):
        override_path = bp.get("overrides", {}).get("backend_router")
        if override_path and override_path.endswith(".py"):
            # Convert 'routers/patient.py' -> 'routers.patient'
            module_name = override_path.replace("/", ".").replace("\\", ".")[:-3]
            try:
                module = importlib.import_module(module_name)
                if hasattr(module, "router"):
                    app.include_router(module.router)
                    print(f"Loaded custom router for {bp['name']} from {override_path}")
            except ModuleNotFoundError as e:
                print(
                    f"Warning: Could not load router override {override_path} for {bp['name']}: {e}"
                )

    # ─── Module Registry ────────────────────────────────────────────────
    @core_router.get("/modules")
    def list_modules(current_user: models.User = Depends(get_current_user)):
        """Return all modules grouped by their module category, including full UI metadata."""
        grouped: dict = {}
        for bp in load_blueprints(settings):
            name = bp.get("name")
            if not name:
                continue

            module_group = bp.get("module", "Other")
            slug = (bp.get("slug") or name).lower()
            permission_namespace = (bp.get("permission_namespace") or slug).lower()

            try:
                check_permissions(current_user, f"{permission_namespace}:read")
                has_permission = True
            except HTTPException:
                has_permission = False

            if not has_permission and "*:*" not in [
                p.code for p in current_user.role.permissions
            ]:
                continue

            module_data = {
                "name": name,
                "slug": slug,
                "ui": bp.get("ui", {}),
                "views": bp.get("views", []),
                "overrides": bp.get("overrides", {}),
                "features": bp.get("features", {}),
                "permission_namespace": permission_namespace,
            }
            grouped.setdefault(module_group, []).append(module_data)
        return grouped

    @core_router.get("/modules/{module_slug}")
    def get_module_definition(
        module_slug: str, current_user: models.User = Depends(get_current_user)
    ):
        for bp in load_blueprints(settings):
            name = bp.get("name")
            if not name:
                continue

            slug = (bp.get("slug") or name).lower()
            if slug != module_slug.lower():
                continue

            permission_namespace = (bp.get("permission_namespace") or slug).lower()
            check_permissions(current_user, f"{permission_namespace}:read")
            return bp

        raise HTTPException(status_code=404, detail=f"Module '{module_slug}' not found")

    def get_scoped_query(model, db: Session, current_user: models.User):
        """
        Apply row-level security / data scoping to generic queries.
        If the model has a `tenant_id` and the user is not a superadmin,
        filter records by the user's `tenant_id`.
        For now, as an example, if the model has a `user_id`, we might filter by user_id
        unless they have wildcard access. Here we can implement generic row-level security.
        """
        query = db.query(model)

        # Superadmin check
        if "*:*" in [p.code for p in current_user.role.permissions]:
            return query

        # Example Row-Level Security:
        # If the model has a 'tenant_id' field, enforce that it matches the user's tenant_id.
        # Note: You'll need to add tenant_id to your User model if you use multi-tenancy.
        if hasattr(model, 'tenant_id') and hasattr(current_user, 'tenant_id'):
            query = query.filter(model.tenant_id == current_user.tenant_id)

        return query

    # ─── Records CRUD ────────────────────────────────────────────────────
    # 1. First, build the generic endpoints programmatically based on blueprints so FastAPI
    #    can generate the correct OpenAPI docs and validations using the dynamic Pydantic models.
    for bp in load_blueprints(settings):
        bp_name = bp.get("name", "")
        if not bp_name:
            continue

        model_name = bp_name.replace(" ", "")
        slug = bp.get("slug", bp_name.lower().replace(" ", "_"))

        # Create dynamic schemas
        CreateSchema = create_pydantic_model_from_blueprint(bp, is_update=False)
        UpdateSchema = create_pydantic_model_from_blueprint(bp, is_update=True)

        def create_route_handler(m_name=model_name, schema=CreateSchema):
            def route_handler(
                data: schema,
                db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user),
            ):
                check_permissions(current_user, f"{m_name.lower()}:write")
                model = get_model_by_name(m_name)

                # Convert the validated Pydantic model to a dict, excluding unset fields
                data_dict = data.dict(exclude_unset=True)

                # PRE HOOK
                registry.hooks.execute(m_name, "before_create", data_dict, current_user, db)

                instance = model(**data_dict)
                db.add(instance)
                db.commit()
                db.refresh(instance)

                # POST HOOK
                registry.hooks.execute(m_name, "after_create", instance, current_user, db)

                if settings.enable_audit:
                    log_audit(
                        db,
                        m_name,
                        instance.id,
                        "Created",
                        changes=data_dict,
                        actor=current_user.full_name,
                    )
                return model_to_dict(instance)
            return route_handler

        def update_route_handler(m_name=model_name, schema=UpdateSchema):
            def route_handler(
                record_id: int,
                data: schema,
                db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user),
            ):
                check_permissions(current_user, f"{m_name.lower()}:write")
                model = get_model_by_name(m_name)
                query = get_scoped_query(model, db, current_user)
                instance = query.filter(model.id == record_id).first()
                if not instance:
                    raise HTTPException(status_code=404, detail="Record not found")

                data_dict = data.dict(exclude_unset=True)

                # PRE HOOK
                registry.hooks.execute(m_name, "before_update", instance, data_dict, current_user, db)

                changes = {}
                for key, value in data_dict.items():
                    if hasattr(instance, key) and key != "id":
                        old_value = getattr(instance, key)
                        if old_value != value:
                            changes[key] = {"old": old_value, "new": value}
                        setattr(instance, key, value)

                db.commit()
                db.refresh(instance)

                # POST HOOK
                registry.hooks.execute(m_name, "after_update", instance, changes, current_user, db)

                if changes and settings.enable_audit:
                    log_audit(
                        db,
                        m_name,
                        instance.id,
                        "Updated",
                        changes=changes,
                        actor=current_user.full_name,
                    )
                return model_to_dict(instance)
            return route_handler

        # Add explicit typed routes for this specific model slug
        # We mount them dynamically so that FastAPI discovers the schemas!
        core_router.add_api_route(
            f"/app/{slug}",
            create_route_handler(),
            methods=["POST"],
            status_code=201,
            response_model=None, # generic dict returned
            tags=[bp_name]
        )

        core_router.add_api_route(
            f"/app/{slug}/{{record_id}}",
            update_route_handler(),
            methods=["PUT"],
            response_model=None,
            tags=[bp_name]
        )

    # ─── Generic Fallback GET / DELETE ─────────────────────────────────────────
    # We still use generic string-based route definitions for GET / DELETE because
    # they don't require complex Pydantic request body validation.
    @core_router.get("/app/{model_name}")
    def list_records(
        model_name: str,
        request: Request,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        check_permissions(current_user, f"{model_name.lower()}:read")
        model = get_model_by_name(model_name)
        query = get_scoped_query(model, db, current_user)

        # Pagination parameters
        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))

        # Restrict limit to avoid massive queries
        limit = min(limit, 100)

        # Filter out pagination params and apply exact match filtering on allowed columns
        for key, value in request.query_params.items():
            if key in ("limit", "offset"):
                continue

            # Simple query validation: only allow filtering on actual columns (not relationships/methods)
            if hasattr(model, key):
                column = getattr(model, key)
                # Ensure it's an actual SQLAlchemy instrumented attribute representing a column
                if hasattr(column, "expression"):
                    query = query.filter(column == value)

        total = query.count()
        records = query.offset(offset).limit(limit).all()

        return {
            "data": [model_to_dict(r) for r in records],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


    @core_router.get("/app/{model_name}/{record_id}")
    def get_record(
        model_name: str,
        record_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        check_permissions(current_user, f"{model_name.lower()}:read")
        model = get_model_by_name(model_name)
        query = get_scoped_query(model, db, current_user)
        instance = query.filter(model.id == record_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Record not found")
        return model_to_dict(instance)


    @core_router.delete("/app/{model_name}/{record_id}", status_code=204)
    def delete_record(
        model_name: str,
        record_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        check_permissions(current_user, f"{model_name.lower()}:delete")
        model = get_model_by_name(model_name)
        query = get_scoped_query(model, db, current_user)
        instance = query.filter(model.id == record_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Record not found")

        old_data = model_to_dict(instance)

        # PRE HOOK
        registry.hooks.execute(model_name, "before_delete", instance, current_user, db)

        db.delete(instance)
        db.commit()

        # POST HOOK
        registry.hooks.execute(model_name, "after_delete", old_data, current_user, db)

        if settings.enable_audit:
            log_audit(
                db,
                model_name,
                record_id,
                "Deleted",
                changes=old_data,
                actor=current_user.full_name,
            )
        return None

    app.include_router(core_router)

    return app


# Maintain backward compatibility for `uvicorn main:app`
settings = get_settings()
app = create_app(settings)
