import json
from sqlalchemy.orm import Session, joinedload
from app.models.audit_log import AuditLog


def write_log(
    db: Session,
    user_id: int | None,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    details: dict | None = None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details, ensure_ascii=False) if details else None,
    )
    db.add(log)
    db.commit()


def get_logs(db: Session, limit: int = 200, offset: int = 0):
    return (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_logs_by_user(db: Session, user_id: int, limit: int = 100):
    return (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user))
        .filter(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
