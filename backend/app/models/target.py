from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    base_url = Column(String, unique=True, nullable=False)
    notes = Column(String, nullable=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    scans = relationship("Scan", back_populates="target", cascade="all, delete-orphan")