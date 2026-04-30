from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(20), nullable=False, index=True)   # create / update / delete / login / ai_query
    entity_type = Column(String(50), nullable=True, index=True)  # client / vehicle / work_order / part / user
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON-строка с подробностями
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Связи
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} {self.entity_type}#{self.entity_id} by user#{self.user_id}>"
