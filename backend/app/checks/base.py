from dataclasses import dataclass
from typing import Optional
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


@dataclass
class Finding:
    check_id: str
    title: str
    severity: str
    url: str
    parameter: Optional[str]
    evidence: str
    remediation: str


class ScanCheck:
    """Base interface every vulnerability check implements."""
    
    id: str = "check-id"
    name: str = "Human-readable name"
    severity: str = "info"  # info | low | medium | high | critical
    owasp_category: str = "Uncategorized"

    def applies_to(self, page: DiscoveredPage) -> bool:
        """Return True if this check is relevant to the given crawled page."""
        raise NotImplementedError

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        """Execute the check and return a list of findings."""
        raise NotImplementedError
