from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    check_id = Column(String, nullable=False)
    url = Column(String, nullable=False)
    parameter = Column(String, nullable=True)
    severity = Column(String, nullable=False)
    evidence = Column(String, nullable=False)
    remediation = Column(String, nullable=False)

    scan = relationship("Scan", back_populates="findings")