from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)
    status = Column(String, default="queued", nullable=False)
    pages_crawled = Column(Integer, default=0)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    finished_at = Column(DateTime, nullable=True)

    target = relationship("Target", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")