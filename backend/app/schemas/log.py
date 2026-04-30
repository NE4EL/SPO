from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
