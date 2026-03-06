from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
import models
import glob
import yaml
import inspect
import importlib

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

# Load any custom router overrides from the routers/ directory
for router_file in glob.glob("routers/*.py"):
    if router_file.endswith("__init__.py"):
        continue
    # Convert 'routers/patient.py' -> 'routers.patient'
    module_name = router_file.replace("/", ".").replace("\\", ".")[:-3]
    module = importlib.import_module(module_name)
    if hasattr(module, "router"):
        app.include_router(module.router)


# ─── Module Registry ────────────────────────────────────────────────


@app.get("/v1/modules")
def list_modules():
    """Return all modules grouped by their module category."""
    grouped: dict = {}
    for bp in load_blueprints():
        name = bp["name"]
        module_group = bp.get("module", "Other")
        slug = name.lower()
        grouped.setdefault(module_group, []).append({"name": name, "slug": slug})
    return grouped


@app.get("/v1/modules/{model_name}")
def get_module_definition(model_name: str):
    """Return the full field definition for a model (for dynamic form rendering)."""
    for bp in load_blueprints():
        if bp["name"].lower() == model_name.lower():
            return bp
    raise HTTPException(status_code=404, detail=f"Module '{model_name}' not found")


# ─── Records CRUD ────────────────────────────────────────────────────


@app.get("/v1/app/{model_name}")
def list_records(model_name: str, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    return [model_to_dict(r) for r in db.query(model).all()]


@app.post("/v1/app/{model_name}", status_code=201)
def create_record(model_name: str, data: dict, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    instance = model(**data)
    db.add(instance)
    db.commit()
    db.refresh(instance)
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
    for key, value in data.items():
        if hasattr(instance, key):
            setattr(instance, key, value)
    db.commit()
    db.refresh(instance)
    return model_to_dict(instance)


@app.delete("/v1/app/{model_name}/{record_id}", status_code=204)
def delete_record(model_name: str, record_id: int, db: Session = Depends(get_db)):
    model = get_model_by_name(model_name)
    instance = db.query(model).filter(model.id == record_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(instance)
    db.commit()
    return None
