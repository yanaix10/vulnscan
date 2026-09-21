from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TargetCreate(BaseModel):
    base_url: str
    notes: Optional[str] = None

class TargetResponse(BaseModel):
    id: int
    base_url: str
    notes: Optional[str] = None
    added_at: datetime

    model_config = {"from_attributes": True}