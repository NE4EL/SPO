from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import require_manager_or_admin
from app.services.log_service import write_log
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.services.client_service import (
    get_all_clients, get_client_by_id,
    create_client, update_client, delete_client
)
from app.models.user import User

router = APIRouter(prefix="/clients", tags=["Клиенты"])


@router.get("/", response_model=List[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    return get_all_clients(db)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return client


@router.post("/", response_model=ClientResponse)
def add_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    client = create_client(db, data)
    write_log(db, current_user.id, "create", "client", client.id, {"full_name": client.full_name})
    return client


@router.put("/{client_id}", response_model=ClientResponse)
def edit_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    client = update_client(db, client_id, data)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    write_log(db, current_user.id, "update", "client", client_id)
    return client


@router.delete("/{client_id}")
def remove_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    result = delete_client(db, client_id)
    if not result:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    write_log(db, current_user.id, "delete", "client", client_id)
    return {"message": "Клиент удалён"}
