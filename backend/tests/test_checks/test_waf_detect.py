import pytest
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.waf_detect import WafDetectCheck


@pytest.mark.asyncio
async def test_waf_detect_phpids():
    page = DiscoveredPage(
        url="http://target.local/",
        status_code=200,
        content_type="text/html",
        headers={},
        body="<div>Hacking attempt detected and logged.<br />Have a nice day.</div>"
    )
    check = WafDetectCheck()
    assert check.applies_to(page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "waf-detect"
    assert "PHPIDS" in findings[0].title
