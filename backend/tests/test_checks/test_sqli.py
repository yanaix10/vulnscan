import pytest
import respx
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.sqli import SQLInjectionCheck


@pytest.mark.asyncio
@respx.mock
async def test_sqli_plugin():
    respx.get("http://target.local/item?id=1%27").respond(
        500, headers={"content-type": "text/html"}, html="mysql_fetch_array() expects parameter"
    )
    page = DiscoveredPage("http://target.local/item?id=1", 200, "text/html", {}, "", query_params=["id"])
    check = SQLInjectionCheck()

    async with ScopedHttpClient(ScopeValidator(["target.local"])) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "sqli"
    assert findings[0].severity == "critical"
