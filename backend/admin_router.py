from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth_utils import get_current_user, check_permissions, get_password_hash
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    module: str


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    permissions: List[PermissionRead]


class RoleCreate(BaseModel):
    name: str
    permission_ids: List[int]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: Optional[RoleRead] = None
    is_active: Optional[bool] = True


class UserUpdate(BaseModel):
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


@router.get("/permissions", response_model=List[PermissionRead])
def list_permissions(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    check_permissions(current_user, "admin:permission:read")
    return db.query(models.Permission).all()


@router.get("/roles", response_model=List[RoleRead])
def list_roles(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    check_permissions(current_user, "admin:role:read")
    return db.query(models.Role).all()


@router.post("/roles", response_model=RoleRead)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    check_permissions(current_user, "admin:role:create")
    role = models.Role(name=role_data.name)
    perms = (
        db.query(models.Permission)
        .filter(models.Permission.id.in_(role_data.permission_ids))
        .all()
    )
    role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    check_permissions(current_user, "admin:role:update")
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role.name = role_data.name
    perms = (
        db.query(models.Permission)
        .filter(models.Permission.id.in_(role_data.permission_ids))
        .all()
    )
    role.permissions = perms
    db.commit()
    db.refresh(role)
    return role


@router.get("/users", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    check_permissions(current_user, "admin:user:read")
    return db.query(models.User).all()


@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    check_permissions(current_user, "admin:user:update")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.role_id is not None:
        user.role_id = user_data.role_id
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)
    return user
