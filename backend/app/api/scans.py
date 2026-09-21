from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
import asyncio
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from typing import Optional
from app.database import get_db, SessionLocal
from app.models.scan import Scan
from app.models.target import Target
from app.models.finding import Finding
from app.schemas.scan import ScanCreate, ScanResponse
from app.schemas.finding import FindingResponse
from app.core.scan_engine import ScanEngine
from app.core.session_manager import AuthConfig
from app.api.reports import download_report

logger = logging.getLogger("vulnscan.api.scans")
router = APIRouter()

def run_scan_engine_task(
    scan_id: int,
    target_url: str,
    max_depth: int = 3,
    max_pages: int = 50,
    rate_limit: float = 5.0,
    use_spa: bool = False,
    auth_config: Optional[AuthConfig] = None,
):
    """Executes the actual scan engine in the background with its own DB session."""
    db = SessionLocal()
    try:
        engine = ScanEngine(
            target_url=target_url,
            db_session=db,
            max_depth=max_depth,
            max_pages=max_pages,
            rate_limit=rate_limit,
            use_spa=use_spa,
            auth_config=auth_config,
        )
        asyncio.run(engine.run(scan_id=scan_id))
    except Exception as e:
        logger.error(f"Scan Engine execution failed for scan {scan_id}: {e}")
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "failed"
            scan.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()

@router.post("/", response_model=ScanResponse)
def create_scan(scan_in: ScanCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Initiates a new scan and returns immediately."""
    target = None
    if scan_in.target_url:
        url = scan_in.target_url.strip()
        target = db.query(Target).filter(Target.base_url == url).first()
        if not target:
            target = Target(base_url=url, notes="Auto-created by scan request")
            db.add(target)
            db.commit()
            db.refresh(target)
    elif scan_in.target_id:
        target = db.query(Target).filter(Target.id == scan_in.target_id).first()

    if not target:
        raise HTTPException(status_code=400, detail="Must provide a valid target_url or target_id")

    new_scan = Scan(target_id=target.id, status="queued", pages_crawled=0)
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    auth_config = None
    if scan_in.bearer_token or scan_in.session_cookie or (scan_in.login_url and scan_in.username and scan_in.password):
        auth_config = AuthConfig(
            bearer_token=scan_in.bearer_token,
            session_cookie=scan_in.session_cookie,
            login_url=scan_in.login_url,
            username=scan_in.username,
            password=scan_in.password,
        )

    background_tasks.add_task(
        run_scan_engine_task,
        scan_id=int(new_scan.id),
        target_url=str(target.base_url),
        max_depth=scan_in.max_depth,
        max_pages=scan_in.max_pages,
        rate_limit=scan_in.rate_limit,
        use_spa=scan_in.use_spa,
        auth_config=auth_config,
    )
    return new_scan

def _format_scan_response(scan: Scan, db: Session) -> ScanResponse:
    target = db.query(Target).filter(Target.id == scan.target_id).first()
    target_url = target.base_url if target else None
    
    findings = db.query(Finding).filter(Finding.scan_id == scan.id).all()
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "total": len(findings)}
    for f in findings:
        sev = (f.severity or "info").lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts[sev] = 1

    return ScanResponse(
        id=scan.id,
        target_id=scan.target_id,
        target_url=target_url,
        status=scan.status,
        pages_crawled=scan.pages_crawled,
        started_at=scan.started_at,
        finished_at=scan.finished_at,
        findings_count=counts,
    )

@router.get("/", response_model=list[ScanResponse])
def list_scans(db: Session = Depends(get_db)):
    """Lists all scans."""
    scans = db.query(Scan).order_by(Scan.started_at.desc()).all()
    return [_format_scan_response(s, db) for s in scans]

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Polls the current status of a specific scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _format_scan_response(scan, db)

@router.get("/{scan_id}/findings", response_model=list[FindingResponse])
def get_scan_findings(scan_id: int, db: Session = Depends(get_db)):
    """Retrieves all findings for a specific scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return db.query(Finding).filter(Finding.scan_id == scan_id).all()

@router.get("/{scan_id}/report")
def get_scan_report(scan_id: int, format: str = "html", db: Session = Depends(get_db)):
    """Download scan report in HTML, JSON, or SARIF format."""
    return download_report(scan_id=scan_id, format=format, db=db)