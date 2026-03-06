from fastapi import FastAPI, Depends, HTTPException, Request
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

app = FastAPI(title="Viemed API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_model_by_name(name: str):
    """Look up a SQLAlchemy model class by name."""
    model = getattr(models, name.capitalize(), None)
    if not model or not inspect.isclass(model):
        raise HTTPException(status_code=404, detail=f"Module '{name}' not found")
    return model


def model_to_dict(instance) -> dict:
    """Serialize a SQLAlchemy model instance to a plain dict."""
    return {c.name: getattr(instance, c.name) for c in instance.__table__.columns}


def load_blueprints():
    """Load all blueprint YAML files and return as a list."""
    blueprints = []
    for bp_path in glob.glob("blueprints/*.yaml"):
        with open(bp_path, "r") as f:
            bp = yaml.safe_load(f)
            blueprints.append(bp)
    return blueprints


# ─── Custom Routers (Overrides) ──────────────────────────────────────

# Load any custom router overrides specifically mentioned in blueprints
for bp in load_blueprints():
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


@app.get("/v1/modules")
def list_modules():
    """Return all modules grouped by their module category, including full UI metadata."""
    grouped: dict = {}
    for bp in load_blueprints():
        name = bp["name"]
        module_group = bp.get("module", "Other")
        slug = name.lower()

        # Include ui, views, and frontend overrides to drive the frontend UI
        module_data = {
            "name": name,
            "slug": slug,
            "ui": bp.get("ui", {}),
            "views": bp.get("views", []),
            "overrides": bp.get("overrides", {}),
        }
        grouped.setdefault(module_group, []).append(module_data)
    return grouped


@app.get("/v1/modules/{model_name}")
def get_module_definition(model_name: str):
    """Return the full field definition for a model (for dynamic form rendering)."""
    for bp in load_blueprints():
        if bp["name"].lower() == model_name.lower():
            return bp
    raise HTTPException(status_code=404, detail=f"Module '{model_name}' not found")


# ─── Records CRUD ────────────────────────────────────────────────────


def log_audit(
    db: Session,
    model_name: str,
    record_id: int,
    action: str,
    changes: dict = None,
    actor: str = "System User",
):
    """Helper to save an audit log entry."""
    # Prevent infinite loop if we are creating an audit log itself
    if model_name.lower() in ("auditlog", "comment"):
        return
    try:
        AuditModel = get_model_by_name("AuditLog")
        log = AuditModel(
            model_name=model_name,
            record_id=record_id,
            action=action,
            changes=json.dumps(changes) if changes else None,
            actor=actor,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
    except Exception as e:
        print(f"Failed to log audit: {e}")


@app.get("/v1/app/{model_name}")
def list_records(model_name: str, request: Request, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    query = db.query(model)

    # Generic filtering based on query params
    for key, value in request.query_params.items():
        if hasattr(model, key):
            query = query.filter(getattr(model, key) == value)

    return [model_to_dict(r) for r in query.all()]


@app.post("/v1/app/{model_name}", status_code=201)
def create_record(model_name: str, data: dict, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    instance = model(**data)
    db.add(instance)
    db.commit()
    db.refresh(instance)

    log_audit(db, model_name, instance.id, "Created", changes=data)
    return model_to_dict(instance)


@app.get("/v1/app/{model_name}/{record_id}")
def get_record(model_name: str, record_id: int, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    instance = db.query(model).filter(model.id == record_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Record not found")
    return model_to_dict(instance)


@app.put("/v1/app/{model_name}/{record_id}")
def update_record(
    model_name: str, record_id: int, data: dict, db: Session = Depends(get_db)
):
    model = get_model_by_name(model_name)
    instance = db.query(model).filter(model.id == record_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Record not found")

    changes = {}
    for key, value in data.items():
        if hasattr(instance, key):
            old_value = getattr(instance, key)
            if old_value != value:
                changes[key] = {"old": old_value, "new": value}
            setattr(instance, key, value)

    db.commit()
    db.refresh(instance)
    if changes:
        log_audit(db, model_name, instance.id, "Updated", changes=changes)
    return model_to_dict(instance)


@app.delete("/v1/app/{model_name}/{record_id}", status_code=204)
def delete_record(model_name: str, record_id: int, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    instance = db.query(model).filter(model.id == record_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Record not found")

    old_data = model_to_dict(instance)
    db.delete(instance)
    db.commit()

    log_audit(db, model_name, record_id, "Deleted", changes=old_data)
    return None
