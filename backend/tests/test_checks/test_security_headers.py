import pytest
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.security_headers import SecurityHeadersCheck


@pytest.mark.asyncio
async def test_security_headers_missing_and_present():
    # 1. Missing headers
    insecure_page = DiscoveredPage(
        url="http://target.local",
        status_code=200,
        content_type="text/html",
        headers={"Server": "nginx"},
        body="",
    )
    check = SecurityHeadersCheck()
    assert check.applies_to(insecure_page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(insecure_page, client)

    assert len(findings) == 2
    titles = [f.title for f in findings]
    assert "Missing Content-Security-Policy" in titles
    assert "Missing X-Frame-Options" in titles

    # 2. Present headers
    secure_page = DiscoveredPage(
        url="http://target.local",
        status_code=200,
        content_type="text/html",
        headers={
            "content-security-policy": "default-src 'self'",
            "x-frame-options": "DENY"
        },
        body="",
    )
    async with ScopedHttpClient(validator) as client:
        secure_findings = await check.run(secure_page, client)
    
    assert len(secure_findings) == 0
