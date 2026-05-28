from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    mechanic_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), index=True)
    status = Column(String(20), default="pending", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    total_cost = Column(Numeric(10, 2), default=0)
    notes = Column(Text)

    # Связи
    vehicle = relationship("Vehicle", back_populates="work_orders")
    mechanic = relationship("Employee", back_populates="assigned_orders")
    order_parts = relationship("OrderPart", back_populates="work_order", cascade="all, delete-orphan")
    stock_operations = relationship("StockOperation", back_populates="work_order")

    def __repr__(self):
        return f"<WorkOrder {self.order_number} - {self.status}>"

    def complete_order(self, db):
        """
        🔥 ГЛАВНЫЙ МЕТОД - Автоматическое списание запчастей
        """
        if self.status == "completed":
            return {"error": "Order already completed"}

        from app.models.warehouse import StockOperation, LowStockAlert

        results = {
            "parts_deducted": [],
            "alerts_created": []
        }

        # Списываем каждую запчасть
        for order_part in self.order_parts:
            # 1. Создать операцию склада
            stock_op = StockOperation(
                part_id=order_part.part_id,
                operation_type="OUT",
                quantity=order_part.quantity,
                work_order_id=self.id,
                performed_by_id=self.mechanic_id,
                operation_date=datetime.now(timezone.utc),
                notes=f"Автосписание при завершении заказа {self.order_number}"
            )
            db.add(stock_op)

            # 2. Уменьшить остаток
            part = order_part.part
            old_quantity = part.quantity_in_stock
            part.quantity_in_stock -= order_part.quantity

            results["parts_deducted"].append({
                "part_id": part.id,
                "name": part.name,
                "quantity_used": order_part.quantity,
                "old_stock": old_quantity,
                "new_stock": part.quantity_in_stock
            })

            # 3. Проверить низкий остаток
            if part.quantity_in_stock <= part.min_quantity:
                alert = LowStockAlert(
                    part_id=part.id,
                    current_quantity=part.quantity_in_stock
                )
                db.add(alert)

                results["alerts_created"].append({
                    "part_id": part.id,
                    "name": part.name,
                    "current_stock": part.quantity_in_stock,
                    "min_quantity": part.min_quantity
                })

        # 4. Завершить заказ
        self.status = "completed"
        self.completed_at = datetime.now(timezone.utc)

        # Рассчитать итоговую стоимость
        self.total_cost = sum(op.price_at_moment * op.quantity for op in self.order_parts)

        db.commit()
        return results


class OrderPart(Base):
    __tablename__ = "order_parts"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price_at_moment = Column(Numeric(10, 2), nullable=False)

    # Связи
    work_order = relationship("WorkOrder", back_populates="order_parts")
    part = relationship("Part", back_populates="order_parts")

    def __repr__(self):
        return f"<OrderPart {self.part_id} x{self.quantity}>"