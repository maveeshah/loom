import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
from database import get_db

from settings import get_settings

settings = get_settings()

# Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", settings.jwt_secret)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for demo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt requires bytes
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    # Hash password and return as string
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def check_permissions(user: models.User, required_permission: str):
    """
    Checks if a user has a specific permission.
    required_permission format: "module:action" (e.g., "patient:read")
    """
    if not user.role:
        raise HTTPException(status_code=403, detail="Forbidden: No role assigned")

    # Convert Permission objects to a set of codes for efficient lookup
    user_perm_codes = {p.code for p in user.role.permissions}

    # Superadmin wildcard
    if "*:*" in user_perm_codes:
        return True

    if required_permission in user_perm_codes:
        return True

    module, action = required_permission.split(":")

    # Module wildcard (e.g., "patient:*")
    if f"{module}:*" in user_perm_codes:
        return True

    raise HTTPException(
        status_code=403, detail=f"Forbidden: Missing permission {required_permission}"
    )
