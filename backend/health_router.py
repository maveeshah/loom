"""
Health check endpoints for monitoring and load balancers.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
from pydantic import BaseModel
from typing import Dict, Any
import time

router = APIRouter(prefix="/health", tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: float
    checks: Dict[str, Any]


@router.get("", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    Used by load balancers and monitoring systems.
    """
    checks = {}

    # Database check
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy"}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}

    # Determine overall status
    status = "healthy" if all(
        c.get("status") == "healthy" for c in checks.values()
    ) else "unhealthy"

    return HealthResponse(
        status=status,
        version="0.1.0b1",
        timestamp=time.time(),
        checks=checks
    )


@router.get("/live")
async def liveness_check():
    """
    Kubernetes liveness probe.
    Returns 200 if the application is running.
    """
    return {"status": "alive"}


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Kubernetes readiness probe.
    Returns 200 if the application is ready to serve traffic.
    """
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}
