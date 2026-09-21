import pytest
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.insecure_cookies import InsecureCookiesCheck


@pytest.mark.asyncio
async def test_insecure_cookies():
    # Insecure cookie
    insecure_page = DiscoveredPage(
        url="https://target.local",
        status_code=200,
        content_type="text/html",
        headers={"Set-Cookie": "session_id=12345; path=/"},
        body="",
    )
    check = InsecureCookiesCheck()
    assert check.applies_to(insecure_page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(insecure_page, client)

    assert len(findings) == 2
    titles = [f.title for f in findings]
    assert "Missing HttpOnly Flag" in titles
    assert "Missing Secure Flag" in titles

    # Secure cookie
    secure_page = DiscoveredPage(
        url="https://target.local",
        status_code=200,
        content_type="text/html",
        headers={"Set-Cookie": "session_id=12345; path=/; HttpOnly; Secure"},
        body="",
    )
    async with ScopedHttpClient(validator) as client:
        secure_findings = await check.run(secure_page, client)
    
    assert len(secure_findings) == 0
