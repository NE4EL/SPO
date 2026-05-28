from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_admin, get_current_user
from app.services.user_service import (
    get_all_users, get_user_by_id, create_user, update_user, delete_user
)
from app.services.log_service import write_log
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Пользователи"])


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users = get_all_users(db)
    result = []
    for u in users:
        emp = u.employee
        result.append(UserResponse(
            id=u.id, username=u.username, email=u.email, role=u.role, created_at=u.created_at,
            full_name=emp.full_name if emp else None,
            phone=emp.phone if emp else None,
            position=emp.position if emp else None,
        ))
    return result


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    emp = user.employee
    return UserResponse(
        id=user.id, username=user.username, email=user.email, role=user.role, created_at=user.created_at,
        full_name=emp.full_name if emp else None,
        phone=emp.phone if emp else None,
        position=emp.position if emp else None,
    )


@router.post("/", response_model=UserResponse)
def add_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = create_user(db, data)
    write_log(db, current_user.id, "create", "user", user.id, {"username": user.username, "role": user.role})
    emp = user.employee
    return UserResponse(
        id=user.id, username=user.username, email=user.email, role=user.role, created_at=user.created_at,
        full_name=emp.full_name if emp else None,
        phone=emp.phone if emp else None,
        position=emp.position if emp else None,
    )


@router.put("/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = update_user(db, user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    write_log(db, current_user.id, "update", "user", user.id, {"username": user.username})
    emp = user.employee
    return UserResponse(
        id=user.id, username=user.username, email=user.email, role=user.role, created_at=user.created_at,
        full_name=emp.full_name if emp else None,
        phone=emp.phone if emp else None,
        position=emp.position if emp else None,
    )


@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить себя")
    result = delete_user(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    write_log(db, current_user.id, "delete", "user", user_id)
    return {"message": "Пользователь удалён"}
