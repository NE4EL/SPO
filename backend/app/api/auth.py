from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.password import verify_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from app.services.user_service import get_user_by_username, get_user_by_id
from app.services.log_service import write_log
from app.schemas.user import (
    LoginRequest, TokenResponse, RefreshRequest, AccessTokenResponse, UserResponse
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    payload = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    write_log(db, user.id, "login", "user", user.id, {"username": user.username})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        username=user.username,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный refresh-токен",
        )

    user_id = payload.get("sub")
    user = get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    new_access_token = create_access_token({"sub": str(user.id), "role": user.role})
    return AccessTokenResponse(access_token=new_access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    employee = current_user.employee
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
        full_name=employee.full_name if employee else None,
        phone=employee.phone if employee else None,
        position=employee.position if employee else None,
    )
