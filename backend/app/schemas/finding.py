from pydantic import BaseModel
from typing import Optional

class FindingResponse(BaseModel):
    id: int
    scan_id: int
    check_id: str
    url: str
    parameter: Optional[str] = None
    severity: str
    evidence: str
    remediation: str

    model_config = {"from_attributes": True}