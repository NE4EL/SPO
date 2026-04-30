from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связь
    vehicles = relationship("Vehicle", back_populates="client", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Client {self.full_name}>"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    plate_number = Column(String(15), unique=True, nullable=False, index=True)
    mileage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    client = relationship("Client", back_populates="vehicles")
    work_orders = relationship("WorkOrder", back_populates="vehicle", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Vehicle {self.brand} {self.model} ({self.plate_number})>"