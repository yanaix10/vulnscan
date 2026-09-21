from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.finding import Finding
from app.schemas.finding import FindingResponse

router = APIRouter()

@router.get("/scan/{scan_id}", response_model=list[FindingResponse])
def get_findings_by_scan(scan_id: int, db: Session = Depends(get_db)):
    """Retrieves all vulnerabilities discovered during a specific scan."""
    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    return findings

@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    """Retrieves a single finding by ID in full detail."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding