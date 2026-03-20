from Data.app.database import Base

# Импортируем все модели, чтобы SQLAlchemy их видел
from Data.app.models.user import User, Employee
from Data.app.models.client import Client, Vehicle
from Data.app.models.work_order import WorkOrder, OrderPart
from Data.app.models.warehouse import Part, StockOperation, LowStockAlert

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
]