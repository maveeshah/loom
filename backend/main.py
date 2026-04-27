from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
import models
import glob
import yaml
import inspect
import importlib
import logging
from auth_utils import get_current_user, check_permissions
import auth_router
from typing import Dict
import admin_router
import settings_router
import health_router
from plugin_registry import registry
from schema_factory import create_pydantic_model_from_blueprint
from audit_logger import log_audit
from execution_mode import get_mode_config
from logging_config import setup_logging
from middleware import SecurityHeadersMiddleware, RequestLoggingMiddleware, RateLimitMiddleware

from settings import get_settings, Settings


# Global mapping for blueprints data to help resolve namespaces and models
blueprint_registry: Dict[str, dict] = {}

# Setup structured logging
logger = logging.getLogger("loom.main")


def load_blueprint_registry(settings: Settings):
    """Load all blueprints into a global registry for lookup by slug."""
    global blueprint_registry
    blueprint_registry.clear()
    for root in settings.blueprint_paths:
        pattern = f"{root.rstrip('/')}" + "/*.yaml"
        for bp_path in glob.glob(pattern):
            with open(bp_path, "r") as f:
                bp = yaml.safe_load(f) or {}
                slug = bp.get("slug")
                if slug:
                    blueprint_registry[slug.lower()] = bp


def get_model_by_name(name: str):
    """Look up a SQLAlchemy model class by name case-insensitively."""
    for attr_name in dir(models):
        if attr_name.lower() == name.lower():
            model = getattr(models, attr_name)
            if inspect.isclass(model):
                return model
    raise HTTPException(status_code=404, detail=f"Module '{name}' not found")


def model_to_dict(instance, columns=None) -> dict:
    """Serialize a SQLAlchemy model instance to a plain dict, flattening the JSONB 'data' column if present."""
    result = {}
    if columns is None:
        columns = [c.name for c in instance.__table__.columns]

    for name in columns:
        if name == "data":
            data_val = getattr(instance, name) or {}
            result.update(data_val)
        else:
            result[name] = getattr(instance, name)
    return result


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


def create_app(settings: Settings = None) -> FastAPI:
    if settings is None:
        settings = get_settings()

    # Resolve execution mode flags once for the entire app lifecycle
    mode_config = get_mode_config()
    mode_label = "Organization" if mode_config["strict_rbac"] else "Personal"

    @asynccontextmanager
    async def lifespan_handler(app_instance: FastAPI):
        import asyncio
        from dev_watcher import watch_blueprints
        
        watch_task = None
        if not mode_config.get("blueprint_lock"):
            watch_task = asyncio.create_task(watch_blueprints(settings.blueprint_paths))
            
        yield
        
        if watch_task:
            watch_task.cancel()

    # Setup logging
    json_logs = mode_config.get("strict_rbac", False)  # JSON logs in production
    setup_logging(level="INFO" if mode_config.get("strict_rbac") else "DEBUG", json_format=json_logs)

    app = FastAPI(
        title=settings.app_title,
        description=f"Running in **{mode_label}** mode. Debug panel: {'disabled' if not mode_config.get('debug_panel') else 'enabled'}.",
        lifespan=lifespan_handler,
        version="0.1.0b1",
    )

    # Add security middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Initialize blueprint registry
    load_blueprint_registry(settings)

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

    # Include Authentication and Admin Routers
    app.include_router(auth_router.router, prefix="/v1")
    app.include_router(admin_router.router, prefix="/v1")
    app.include_router(settings_router.router, prefix="/v1")
    app.include_router(health_router.router)

    # Include Debug Router (Personal Mode Only)
    if mode_config.get("debug_panel"):
        import debug_router
        app.include_router(debug_router.router)

    # Register Backend Plugin Routers
    for plugin_name, manifest in registry.plugins.items():
        if manifest.router:
            core_router.include_router(manifest.router)
            logger.info(f"Loaded plugin router for {plugin_name}")

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
                    logger.info(f"Loaded custom router for {bp['name']} from {override_path}")
            except ModuleNotFoundError as e:
                logger.warning(
                    f"Could not load router override {override_path} for {bp['name']}: {e}"
                )

    @core_router.get("/modules")
    async def list_modules(current_user: models.User = Depends(get_current_user)):
        """Return all modules grouped by their module category, including full UI metadata."""
        grouped: dict = {}
        for bp in blueprint_registry.values():
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
    async def get_module_definition(
        module_slug: str, current_user: models.User = Depends(get_current_user)
    ):
        for bp in blueprint_registry.values():
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

    def get_scoped_query(model, current_user: models.User):
        """
        Apply row-level security / data scoping to generic queries.
        If the model has a `tenant_id` and the user is not a superadmin,
        filter records by the user's `tenant_id`.
        For now, as an example, if the model has a `user_id`, we might filter by user_id
        unless they have wildcard access. Here we can implement generic row-level security.
        """
        query = select(model)

        # Superadmin check
        if "*:*" in [p.code for p in current_user.role.permissions]:
            return query

        # Example Row-Level Security:
        # If the model has a 'tenant_id' field, enforce that it matches the user's tenant_id.
        # Note: You'll need to add tenant_id to your User model if you use multi-tenancy.
        if hasattr(model, "tenant_id") and hasattr(current_user, "tenant_id"):
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

        def create_route_handler(
            m_name=model_name, slug_str=slug, schema_in=CreateSchema
        ):
            async def route_handler(
                data: schema_in,
                db: AsyncSession = Depends(get_db),
                current_user: models.User = Depends(get_current_user),
            ):
                bp = blueprint_registry.get(slug_str.lower(), {})
                ns = bp.get("permission_namespace", slug_str).lower()
                check_permissions(current_user, f"{ns}:create")
                model = get_model_by_name(m_name)

                # Convert the validated Pydantic model to a dict, excluding unset fields
                data_dict = data.dict(exclude_unset=True)
                
                # Split fields between explicit columns and JSONB data
                instance_kwargs = {}
                jsonb_data = {}
                for key, value in data_dict.items():
                    if hasattr(model, key):
                        instance_kwargs[key] = value
                    else:
                        jsonb_data[key] = value
                        
                instance_kwargs["data"] = jsonb_data

                # PRE HOOK
                await registry.hooks.execute(
                    m_name, "before_create", data_dict, current_user, db
                )

                instance = model(**instance_kwargs)
                db.add(instance)
                await db.commit()
                await db.refresh(instance)

                # POST HOOK
                await registry.hooks.execute(
                    m_name, "after_create", instance, current_user, db
                )

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

        def update_route_handler(
            m_name=model_name, slug_str=slug, schema_in=UpdateSchema
        ):
            async def route_handler(
                record_id: int,
                data: schema_in,
                db: AsyncSession = Depends(get_db),
                current_user: models.User = Depends(get_current_user),
            ):
                bp = blueprint_registry.get(slug_str.lower(), {})
                ns = bp.get("permission_namespace", slug_str).lower()
                check_permissions(current_user, f"{ns}:update")
                model = get_model_by_name(m_name)
                query = get_scoped_query(model, current_user)
                
                result = await db.execute(query.filter(model.id == record_id))
                instance = result.scalars().first()
                if not instance:
                    raise HTTPException(status_code=404, detail="Record not found")

                data_dict = data.dict(exclude_unset=True)

                # PRE HOOK
                await registry.hooks.execute(
                    m_name, "before_update", instance, data_dict, current_user, db
                )

                changes = {}
                for key, value in data_dict.items():
                    if hasattr(instance, key) and key != "id":
                        old_value = getattr(instance, key)
                        if old_value != value:
                            changes[key] = {"old": old_value, "new": value}
                        setattr(instance, key, value)
                    elif key != "id":
                        # JSONB handling
                        if not instance.data:
                            instance.data = {}
                        
                        # SQLAlchemy JSONB mutation tracking requires explicit assignment
                        # So we copy, modify, and re-assign
                        current_data = instance.data.copy()
                        old_value = current_data.get(key)
                        if old_value != value:
                            changes[key] = {"old": old_value, "new": value}
                        current_data[key] = value
                        instance.data = current_data

                await db.commit()
                await db.refresh(instance)

                # POST HOOK
                await registry.hooks.execute(
                    m_name, "after_update", instance, changes, current_user, db
                )

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
            response_model=None,  # generic dict returned
            tags=[bp_name],
        )

        core_router.add_api_route(
            f"/app/{slug}/{{record_id}}",
            update_route_handler(),
            methods=["PUT"],
            response_model=None,
            tags=[bp_name],
        )

    # ─── Generic Fallback GET / DELETE ─────────────────────────────────────────
    # We still use generic string-based route definitions for GET / DELETE because
    # they don't require complex Pydantic request body validation.
    @core_router.get("/app/{model_name}")
    async def list_records(
        model_name: str,
        request: Request,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        bp = blueprint_registry.get(model_name.lower(), {})
        ns = bp.get("permission_namespace", model_name).lower()
        check_permissions(current_user, f"{ns}:read")

        # Try to resolve model using table_name first if available, then by name
        resolved_model_name = bp.get("name", model_name).replace(" ", "")
        model = get_model_by_name(resolved_model_name)
        query = get_scoped_query(model, current_user)

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

        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        records_query = query.offset(offset).limit(limit)
        result = await db.execute(records_query)
        records = result.scalars().all()

        # Extract column names once to avoid repeated introspection in the loop
        column_names = [c.name for c in model.__table__.columns]

        return {
            "data": [model_to_dict(r, columns=column_names) for r in records],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    @core_router.get("/app/{model_name}/{record_id}")
    async def get_record(
        model_name: str,
        record_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        bp = blueprint_registry.get(model_name.lower(), {})
        ns = bp.get("permission_namespace", model_name).lower()
        check_permissions(current_user, f"{ns}:read")

        resolved_model_name = bp.get("name", model_name).replace(" ", "")
        model = get_model_by_name(resolved_model_name)
        query = get_scoped_query(model, current_user)
        
        result = await db.execute(query.filter(model.id == record_id))
        instance = result.scalars().first()
        
        if not instance:
            raise HTTPException(status_code=404, detail="Record not found")
        return model_to_dict(instance)

    @core_router.delete("/app/{model_name}/{record_id}", status_code=204)
    async def delete_record(
        model_name: str,
        record_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        bp = blueprint_registry.get(model_name.lower(), {})
        ns = bp.get("permission_namespace", model_name).lower()
        check_permissions(current_user, f"{ns}:delete")

        resolved_model_name = bp.get("name", model_name).replace(" ", "")
        model = get_model_by_name(resolved_model_name)
        query = get_scoped_query(model, current_user)
        
        result = await db.execute(query.filter(model.id == record_id))
        instance = result.scalars().first()
        
        if not instance:
            raise HTTPException(status_code=404, detail="Record not found")

        old_data = model_to_dict(instance)

        # PRE HOOK
        await registry.hooks.execute(model_name, "before_delete", instance, current_user, db)

        await db.delete(instance)
        await db.commit()

        # POST HOOK
        await registry.hooks.execute(model_name, "after_delete", old_data, current_user, db)

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
