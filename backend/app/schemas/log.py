from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int]
    user: Optional[UserBrief] = None
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime
