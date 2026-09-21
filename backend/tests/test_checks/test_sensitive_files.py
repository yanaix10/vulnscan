import pytest
import respx
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.sensitive_files import SensitiveFileExposureCheck


@pytest.mark.asyncio
@respx.mock
async def test_sensitive_file_exposure():
    respx.get("http://target.local/.env").respond(200, text="APP_KEY=secret123\nDB_PASS=admin")
    respx.get("http://target.local/.git/HEAD").respond(200, text="ref: refs/heads/main")
    
    page = DiscoveredPage(
        url="http://target.local/",
        status_code=200,
        content_type="text/html",
        headers={},
        body="",
    )
    check = SensitiveFileExposureCheck()
    assert check.applies_to(page)
    
    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(page, client)
        
    assert len(findings) == 2
    titles = [f.title for f in findings]
    assert "Exposed .env file" in titles
    assert "Exposed .git/HEAD file" in titles
