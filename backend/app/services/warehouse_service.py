from sqlalchemy.orm import Session
from app.models.warehouse import Part, StockOperation, LowStockAlert
from app.schemas.warehouse import PartCreate, PartUpdate, StockOperationCreate


def get_all_parts(db: Session):
    return db.query(Part).all()


def get_part_by_id(db: Session, part_id: int):
    return db.query(Part).filter(Part.id == part_id).first()


def create_part(db: Session, data: PartCreate):
    part = Part(**data.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


def update_part(db: Session, part_id: int, data: PartUpdate):
    part = get_part_by_id(db, part_id)
    if not part:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(part, key, value)
    db.commit()
    db.refresh(part)
    return part


def delete_part(db: Session, part_id: int):
    part = get_part_by_id(db, part_id)
    if not part:
        return None
    db.delete(part)
    db.commit()
    return True


def create_stock_operation(db: Session, data: StockOperationCreate):
    operation = StockOperation(**data.model_dump())
    db.add(operation)

    # Обновляем количество на складе
    part = get_part_by_id(db, data.part_id)
    if data.operation_type == "IN":
        part.quantity_in_stock += data.quantity
    elif data.operation_type == "OUT":
        part.quantity_in_stock -= data.quantity
    elif data.operation_type == "ADJUSTMENT":
        part.quantity_in_stock = data.quantity

    # Проверяем низкий остаток
    if part.quantity_in_stock <= part.min_quantity:
        alert = LowStockAlert(
            part_id=part.id,
            current_quantity=part.quantity_in_stock
        )
        db.add(alert)

    db.commit()
    db.refresh(operation)
    return operation


def get_all_stock_operations(db: Session):
    return db.query(StockOperation).all()


def get_low_stock_alerts(db: Session):
    return db.query(LowStockAlert).filter(LowStockAlert.is_read == False).all()