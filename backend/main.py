from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

app = FastAPI(title="Viemed Portal API")


# Helper to get the model class by name
def get_model_by_name(name: str):
    # This is the "Nitty-Gritty" bit:
    # It looks inside your models.py for a class matching the name
    model = getattr(models, name.capitalize(), None)
    if not model:
        raise HTTPException(status_code=404, detail=f"Schema '{name}' not found")
    return model


@app.get("/v1/portal/{schema_name}")
def list_records(schema_name: str, db: Session = Depends(get_db)):
    model = get_model_by_name(schema_name)
    return db.query(model).all()


@app.post("/v1/portal/{schema_name}")
async def create_record(schema_name: str, data: dict, db: Session = Depends(get_db)):
    model = get_model_by_name(schema_name)
    instance = model(**data)
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance
