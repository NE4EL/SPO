from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ClientCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleCreate(BaseModel):
    client_id: int
    brand: str
    model: str
    year: int
    plate_number: str
    mileage: Optional[int] = 0


class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    plate_number: Optional[str] = None
    mileage: Optional[int] = None


class VehicleResponse(BaseModel):
    id: int
    client_id: int
    brand: str
    model: str
    year: int
    plate_number: str
    mileage: int
    created_at: datetime

    class Config:
        from_attributes = True