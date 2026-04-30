from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    article = Column(String(50), unique=True, nullable=False, index=True)
    quantity_in_stock = Column(Integer, default=0, index=True)
    min_quantity = Column(Integer, default=5)
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(10), default="шт")

    # Связи
    order_parts = relationship("OrderPart", back_populates="part")
    stock_operations = relationship("StockOperation", back_populates="part", cascade="all, delete-orphan")
    alerts = relationship("LowStockAlert", back_populates="part", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Part {self.name} ({self.article}) - {self.quantity_in_stock} {self.unit}>"


class StockOperation(Base):
    __tablename__ = "stock_operations"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False, index=True)
    operation_type = Column(String(20), nullable=False)  # IN, OUT, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    performed_by_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"))
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="SET NULL"), index=True)
    operation_date = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text)

    # Связи
    part = relationship("Part", back_populates="stock_operations")
    performed_by = relationship("Employee", back_populates="stock_operations")
    work_order = relationship("WorkOrder", back_populates="stock_operations")

    def __repr__(self):
        return f"<StockOperation {self.operation_type} - Part#{self.part_id} x{self.quantity}>"


class LowStockAlert(Base):
    __tablename__ = "low_stock_alerts"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False, index=True)
    current_quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False, index=True)

    # Связь
    part = relationship("Part", back_populates="alerts")

    def __repr__(self):
        return f"<LowStockAlert Part#{self.part_id} - {self.current_quantity} units>"