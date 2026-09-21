from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.target import Target
from app.schemas.target import TargetCreate, TargetResponse

router = APIRouter()

@router.post("/", response_model=TargetResponse)
def create_target(target_in: TargetCreate, db: Session = Depends(get_db)):
    """Creates a new target or returns the existing one."""
    existing = db.query(Target).filter(Target.base_url == target_in.base_url).first()
    if existing:
        if target_in.notes and existing.notes != target_in.notes:
            existing.notes = target_in.notes
            db.commit()
            db.refresh(existing)
        return existing
        
    new_target = Target(base_url=target_in.base_url, notes=target_in.notes)
    db.add(new_target)
    db.commit()
    db.refresh(new_target)
    return new_target

@router.get("/", response_model=list[TargetResponse])
def get_targets(db: Session = Depends(get_db)):
    """Retrieves all stored targets."""
    return db.query(Target).all()

@router.get("/{target_id}", response_model=TargetResponse)
def get_target(target_id: int, db: Session = Depends(get_db)):
    """Retrieves a specific target by ID."""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@router.delete("/{target_id}")
def delete_target(target_id: int, db: Session = Depends(get_db)):
    """Deletes a target and its associated scans/findings."""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"status": "deleted", "target_id": target_id}