from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.target import Target
from app.reports.generator import ReportGenerator

router = APIRouter()

@router.get("/{scan_id}/download")
def download_report(scan_id: int, format: str = "json", db: Session = Depends(get_db)):
    """Generates a downloadable report of all findings."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    target = db.query(Target).filter(Target.id == scan.target_id).first()
    target_url = target.base_url if target else f"Target #{scan.target_id}"
    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    
    generator = ReportGenerator(target_url=target_url, findings=findings)
    
    format_lower = format.lower()
    if format_lower == "json":
        return Response(
            content=generator.to_json(),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=report_{scan_id}.json"}
        )
    elif format_lower == "sarif":
        return Response(
            content=generator.to_sarif(),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=report_{scan_id}.sarif"}
        )
    elif format_lower == "html":
        return HTMLResponse(content=generator.to_html())
    
    raise HTTPException(status_code=400, detail=f"Format '{format}' not supported. Choose html, json, or sarif.")