from sqlalchemy.orm import Session
from datetime import datetime
from app.models.work_order import WorkOrder, OrderPart
from app.schemas.work_order import WorkOrderCreate, WorkOrderUpdate, OrderPartCreate


def generate_order_number(db: Session) -> str:
    count = db.query(WorkOrder).count()
    return f"WO-{datetime.now().year}-{count + 1:04d}"


def get_all_orders(db: Session):
    return db.query(WorkOrder).all()


def get_order_by_id(db: Session, order_id: int):
    return db.query(WorkOrder).filter(WorkOrder.id == order_id).first()


def create_order(db: Session, data: WorkOrderCreate):
    order = WorkOrder(
        order_number=generate_order_number(db),
        **data.model_dump()
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def update_order(db: Session, order_id: int, data: WorkOrderUpdate):
    order = get_order_by_id(db, order_id)
    if not order:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


def delete_order(db: Session, order_id: int):
    order = get_order_by_id(db, order_id)
    if not order:
        return None
    db.delete(order)
    db.commit()
    return True


def add_part_to_order(db: Session, order_id: int, data: OrderPartCreate):
    order_part = OrderPart(work_order_id=order_id, **data.model_dump())
    db.add(order_part)
    db.commit()
    db.refresh(order_part)
    return order_part


def complete_order(db: Session, order_id: int):
    order = get_order_by_id(db, order_id)
    if not order:
        return None
    return order.complete_order(db)