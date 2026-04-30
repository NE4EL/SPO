from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_manager_or_admin, require_any_role
from app.services.log_service import write_log
from app.schemas.warehouse import PartCreate, PartUpdate, PartResponse
from app.services.warehouse_service import (
    get_all_parts, get_part_by_id,
    create_part, update_part, delete_part
)
from app.models.user import User

router = APIRouter(prefix="/parts", tags=["Запчасти и склад"])


@router.get("/", response_model=List[PartResponse])
def list_parts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    return get_all_parts(db)


@router.get("/{part_id}", response_model=PartResponse)
def get_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    part = get_part_by_id(db, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    return part


@router.post("/", response_model=PartResponse)
def add_part(
    data: PartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    part = create_part(db, data)
    write_log(db, current_user.id, "create", "part", part.id, {"name": part.name, "article": part.article})
    return part


@router.put("/{part_id}", response_model=PartResponse)
def edit_part(
    part_id: int,
    data: PartUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    part = update_part(db, part_id, data)
    if not part:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    write_log(db, current_user.id, "update", "part", part_id)
    return part


@router.delete("/{part_id}")
def remove_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    result = delete_part(db, part_id)
    if not result:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    write_log(db, current_user.id, "delete", "part", part_id)
    return {"message": "Запчасть удалена"}
