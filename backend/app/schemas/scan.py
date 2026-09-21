from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScanCreate(BaseModel):
    target_id: Optional[int] = None
    target_url: Optional[str] = None
    max_depth: int = 3
    max_pages: int = 50
    rate_limit: float = 5.0
    use_spa: bool = False
    session_cookie: Optional[str] = None
    bearer_token: Optional[str] = None
    login_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class ScanResponse(BaseModel):
    id: int
    target_id: int
    target_url: Optional[str] = None
    status: str
    pages_crawled: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    findings_count: Optional[dict[str, int]] = None

    model_config = {"from_attributes": True}