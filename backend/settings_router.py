from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models
from database import get_db
from auth_utils import get_current_user

router = APIRouter(prefix="/settings", tags=["System Settings"])


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.SystemSetting))
    settings = result.scalars().all()
    return {s.key: s.value for s in settings}


@router.put("/{key}")
async def update_setting(
    key: str,
    value: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Ensure only superadmins or specific roles can change settings
    # For now, we'll allow anyone authenticated for the demo, but in production, check permissions
    result = await db.execute(select(models.SystemSetting).filter(models.SystemSetting.key == key))
    setting = result.scalars().first()
    
    if not setting:
        setting = models.SystemSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value

    await db.commit()
    await db.refresh(setting)
    return {"msg": f"Setting {key} updated"}
