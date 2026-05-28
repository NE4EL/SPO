from app.database import Base

# Импортируем все модели, чтобы SQLAlchemy их видел
from app.models.user import User, Employee
from app.models.client import Client, Vehicle
from app.models.work_order import WorkOrder, OrderPart
from app.models.warehouse import Part, StockOperation, LowStockAlert
from app.models.audit_log import AuditLog

__all__ = [
    "Base",
    "User",
    "Employee",
    "Client",
    "Vehicle",
    "WorkOrder",
    "OrderPart",
    "Part",
    "StockOperation",
    "LowStockAlert",
    "AuditLog",
]
