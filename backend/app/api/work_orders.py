from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_manager_or_admin, require_any_role
from app.services.log_service import write_log
from app.schemas.work_order import (
    WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse,
    OrderPartCreate, OrderPartResponse,
)
from app.services.work_order_service import (
    get_all_orders, get_order_by_id,
    create_order, update_order, delete_order,
    add_part_to_order, complete_order,
)
from app.models.user import User

router = APIRouter(prefix="/work-orders", tags=["Заказ-наряды"])


def _check_mechanic_owns_order(current_user: User, order, db: Session):
    """Механик может работать только со своими заказами."""
    if current_user.role == "mechanic":
        employee = current_user.employee
        if not employee or order.mechanic_id != employee.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Механик может работать только со своими заказами",
            )


@router.get("/", response_model=List[WorkOrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    if current_user.role == "mechanic":
        # Механик видит только свои заказы
        employee = current_user.employee
        if not employee:
            return []
        all_orders = get_all_orders(db)
        return [o for o in all_orders if o.mechanic_id == employee.id]
    return get_all_orders(db)


@router.get("/{order_id}", response_model=WorkOrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    _check_mechanic_owns_order(current_user, order, db)
    return order


@router.post("/", response_model=WorkOrderResponse)
def add_order(
    data: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    order = create_order(db, data)
    write_log(db, current_user.id, "create", "work_order", order.id, {"order_number": order.order_number})
    return order


@router.put("/{order_id}", response_model=WorkOrderResponse)
def edit_order(
    order_id: int,
    data: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    _check_mechanic_owns_order(current_user, order, db)

    # Механик может обновлять только статус
    if current_user.role == "mechanic":
        allowed = WorkOrderUpdate(status=data.status)
        order = update_order(db, order_id, allowed)
    else:
        order = update_order(db, order_id, data)

    write_log(db, current_user.id, "update", "work_order", order_id)
    return order


@router.delete("/{order_id}")
def remove_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    result = delete_order(db, order_id)
    if not result:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    write_log(db, current_user.id, "delete", "work_order", order_id)
    return {"message": "Заказ удалён"}


@router.post("/{order_id}/parts", response_model=OrderPartResponse)
def add_part(
    order_id: int,
    data: OrderPartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    _check_mechanic_owns_order(current_user, order, db)
    return add_part_to_order(db, order_id, data)


@router.post("/{order_id}/complete")
def finish_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    _check_mechanic_owns_order(current_user, order, db)
    result = complete_order(db, order_id)
    write_log(db, current_user.id, "update", "work_order", order_id, {"action": "complete"})
    return result
