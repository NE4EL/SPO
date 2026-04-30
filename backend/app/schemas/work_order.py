from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class WorkOrderCreate(BaseModel):
    vehicle_id: int
    mechanic_id: Optional[int] = None
    notes: Optional[str] = None


class WorkOrderUpdate(BaseModel):
    mechanic_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class WorkOrderResponse(BaseModel):
    id: int
    order_number: str
    vehicle_id: int
    mechanic_id: Optional[int]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    total_cost: float
    notes: Optional[str]

    @field_validator("total_cost", mode="before")
    @classmethod
    def format_total(cls, v) -> float:
        return round(float(v), 2)

    class Config:
        from_attributes = True


class OrderPartCreate(BaseModel):
    part_id: int
    quantity: int
    price_at_moment: float

    @field_validator("price_at_moment")
    @classmethod
    def round_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Цена не может быть отрицательной")
        return round(v, 2)


class OrderPartResponse(BaseModel):
    id: int
    work_order_id: int
    part_id: int
    quantity: int
    price_at_moment: float

    @field_validator("price_at_moment", mode="before")
    @classmethod
    def format_price(cls, v) -> float:
        return round(float(v), 2)

    class Config:
        from_attributes = True