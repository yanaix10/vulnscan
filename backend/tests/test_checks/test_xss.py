import pytest
import respx
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.xss import ReflectedXSSCheck


@pytest.mark.asyncio
@respx.mock
async def test_xss_plugin():
    respx.get("http://target.local/search?q=%3Cscript%3Ealert%28%27VULNSCAN%27%29%3C%2Fscript%3E").respond(
        200, headers={"content-type": "text/html"}, html="<script>alert('VULNSCAN')</script>"
    )
    page = DiscoveredPage("http://target.local/search?q=test", 200, "text/html", {}, "", query_params=["q"])
    check = ReflectedXSSCheck()

    async with ScopedHttpClient(ScopeValidator(["target.local"])) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "reflected-xss"
    assert findings[0].parameter == "q"
