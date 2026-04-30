from sqlalchemy.orm import Session
from app.models.client import Client, Vehicle
from app.schemas.client import ClientCreate, ClientUpdate, VehicleCreate, VehicleUpdate


def get_all_clients(db: Session):
    return db.query(Client).all()


def get_client_by_id(db: Session, client_id: int):
    return db.query(Client).filter(Client.id == client_id).first()


def create_client(db: Session, data: ClientCreate):
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate):
    client = get_client_by_id(db, client_id)
    if not client:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int):
    client = get_client_by_id(db, client_id)
    if not client:
        return None
    db.delete(client)
    db.commit()
    return True


def get_all_vehicles(db: Session):
    return db.query(Vehicle).all()


def get_vehicle_by_id(db: Session, vehicle_id: int):
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def create_vehicle(db: Session, data: VehicleCreate):
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, data: VehicleUpdate):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        return None
    db.delete(vehicle)
    db.commit()
    return True