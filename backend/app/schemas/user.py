from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class RoleEnum(str, Enum):
    admin = "admin"
    manager = "manager"
    mechanic = "mechanic"


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: RoleEnum
    full_name: str
    phone: Optional[str] = None
    position: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime
    full_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    username: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
