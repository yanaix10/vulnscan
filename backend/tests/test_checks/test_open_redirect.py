import pytest
import respx
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.open_redirect import OpenRedirectCheck


@pytest.mark.asyncio
@respx.mock
async def test_open_redirect_plugin():
    respx.get("http://target.local/login?next=http%3A%2F%2Fevil.com").respond(
        302, headers={"location": "http://evil.com"}
    )
    page = DiscoveredPage("http://target.local/login?next=/dashboard", 200, "text/html", {}, "", query_params=["next"])
    check = OpenRedirectCheck()

    async with ScopedHttpClient(ScopeValidator(["target.local"])) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "open-redirect"
    assert findings[0].parameter == "next"
