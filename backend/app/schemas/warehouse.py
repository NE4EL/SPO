from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional


class PartCreate(BaseModel):
    name: str
    article: str
    quantity_in_stock: Optional[int] = 0
    min_quantity: Optional[int] = 5
    price: float
    unit: Optional[str] = "шт"

    @field_validator("price")
    @classmethod
    def round_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Цена не может быть отрицательной")
        return round(v, 2)


class PartUpdate(BaseModel):
    name: Optional[str] = None
    quantity_in_stock: Optional[int] = None
    min_quantity: Optional[int] = None
    price: Optional[float] = None
    unit: Optional[str] = None

    @field_validator("price")
    @classmethod
    def round_price(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Цена не может быть отрицательной")
        return round(v, 2)


class PartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    article: str
    quantity_in_stock: int
    min_quantity: int
    price: float
    unit: str

    @field_validator("price", mode="before")
    @classmethod
    def format_price(cls, v) -> float:
        return round(float(v), 2)


class StockOperationCreate(BaseModel):
    part_id: int
    operation_type: str  # IN, OUT, ADJUSTMENT
    quantity: int
    performed_by_id: Optional[int] = None
    work_order_id: Optional[int] = None
    notes: Optional[str] = None


class StockOperationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    part_id: int
    operation_type: str
    quantity: int
    performed_by_id: Optional[int]
    work_order_id: Optional[int]
    operation_date: datetime
    notes: Optional[str]