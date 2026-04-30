from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_manager_or_admin
from app.services.log_service import write_log
from app.schemas.client import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services.client_service import (
    get_all_vehicles, get_vehicle_by_id,
    create_vehicle, update_vehicle, delete_vehicle
)
from app.models.user import User

router = APIRouter(prefix="/vehicles", tags=["Автомобили"])


@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_all_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    return vehicle


@router.post("/", response_model=VehicleResponse)
def add_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    vehicle = create_vehicle(db, data)
    write_log(db, current_user.id, "create", "vehicle", vehicle.id, {"plate": vehicle.plate_number})
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def edit_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    vehicle = update_vehicle(db, vehicle_id, data)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    write_log(db, current_user.id, "update", "vehicle", vehicle_id)
    return vehicle


@router.delete("/{vehicle_id}")
def remove_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    result = delete_vehicle(db, vehicle_id)
    if not result:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    write_log(db, current_user.id, "delete", "vehicle", vehicle_id)
    return {"message": "Автомобиль удалён"}
