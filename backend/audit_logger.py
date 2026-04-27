from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging

logger = logging.getLogger("loom.audit")


def log_audit(
    db: AsyncSession,
    model_name: str,
    record_id: int,
    action: str,
    changes: dict = None,
    actor: str = "System User",
):
    """Helper to save an audit log entry."""
    if model_name.lower() in ("auditlog", "comment"):
        return
    try:
        from main import get_model_by_name  # Safe import inside function to avoid circular dep
        AuditModel = get_model_by_name("AuditLog")
        log = AuditModel(
            model_name=model_name,
            record_id=record_id,
            action=action,
            changes=changes,  # Now passing dict directly as the column is JSON
            actor=actor,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        logger.debug(f"Audit logged: {model_name}#{record_id} {action} by {actor}")
    except Exception as e:
        logger.error(f"Failed to log audit for {model_name}#{record_id}: {e}")
