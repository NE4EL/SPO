from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_manager_or_admin
from app.services.log_service import get_logs, get_logs_by_user
from app.schemas.log import AuditLogResponse
from app.models.user import User

router = APIRouter(prefix="/logs", tags=["Журнал"])


@router.get("/", response_model=List[AuditLogResponse])
def list_logs(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_logs(db, limit=limit, offset=offset)


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
def list_logs_by_user(
    user_id: int,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_logs_by_user(db, user_id, limit=limit)
