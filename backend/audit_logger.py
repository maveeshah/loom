from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

# Local imports since log_audit needs to lookup the model
# We'll import get_model_by_name dynamically if needed or just use models directly

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
        from main import get_model_by_name # Safe import inside function to avoid circular dep
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
    except Exception as e:
        print(f"Failed to log audit: {e}")
