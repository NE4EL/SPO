from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Роли: 'admin' | 'manager' | 'mechanic'
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    employee = relationship("Employee", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    position = Column(String(50))

    # Связи
    user = relationship("User", back_populates="employee")
    assigned_orders = relationship("WorkOrder", back_populates="mechanic")
    stock_operations = relationship("StockOperation", back_populates="performed_by")

    def __repr__(self):
        return f"<Employee {self.full_name}>"
