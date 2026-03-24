from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
import models
from database import get_db
from auth_utils import (
    verify_password,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
async def get_me(current_user: models.User = Depends(get_current_user)):
    # Load role if lazy loaded, wait in async we often need joinedload, 
    # but let's assume it's loaded by get_current_user for now.
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": {
            "name": current_user.role.name if current_user.role else "No Role",
            "permissions": current_user.role.permissions if current_user.role else [],
        },
    }


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.User).filter(models.User.email == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
async def register(
    email: str,
    password: str,
    full_name: str,
    db: AsyncSession = Depends(get_db),
):
    # Demo helper to create users easily
    result = await db.execute(select(models.User).filter(models.User.email == email))
    db_user = result.scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Fetch the Standard User role
    role_result = await db.execute(select(models.Role).filter(models.Role.name == "Standard User"))
    default_role = role_result.scalars().first()
    
    if not default_role:
        raise HTTPException(status_code=500, detail="Default role not configured")

    new_user = models.User(
        email=email,
        full_name=full_name,
        hashed_password=get_password_hash(password),
        role_id=default_role.id,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"msg": "User created successfully"}


@router.put("/me")
async def update_me(
    full_name: str = None,
    password: str = None,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if full_name:
        current_user.full_name = full_name
    if password:
        current_user.hashed_password = get_password_hash(password)

    await db.commit()
    await db.refresh(current_user)
    return {"msg": "Profile updated successfully"}
