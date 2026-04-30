from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_manager_or_admin
from app.services.log_service import write_log
from app.schemas.warehouse import StockOperationCreate, StockOperationResponse
from app.services.warehouse_service import (
    create_stock_operation, get_all_stock_operations, get_low_stock_alerts
)
from app.models.user import User

router = APIRouter(prefix="/stock", tags=["Запчасти и склад"])


@router.get("/operations", response_model=List[StockOperationResponse])
def list_operations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_all_stock_operations(db)


@router.post("/operations", response_model=StockOperationResponse)
def add_operation(
    data: StockOperationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    operation = create_stock_operation(db, data)
    write_log(
        db, current_user.id, "create", "stock_operation", operation.id,
        {"type": data.operation_type, "part_id": data.part_id, "qty": data.quantity},
    )
    return operation


@router.get("/alerts")
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_low_stock_alerts(db)
