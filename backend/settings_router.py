from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import get_db
from auth_utils import get_current_user

router = APIRouter(prefix="/settings", tags=["System Settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).all()
    return {s.key: s.value for s in settings}


@router.put("/{key}")
def update_setting(
    key: str,
    value: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure only superadmins or specific roles can change settings
    # For now, we'll allow anyone authenticated for the demo, but in production, check permissions
    setting = (
        db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    )
    if not setting:
        setting = models.SystemSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value

    db.commit()
    db.refresh(setting)
    return {"msg": f"Setting {key} updated"}
