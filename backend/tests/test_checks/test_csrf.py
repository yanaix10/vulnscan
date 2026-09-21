import pytest
from app.core.crawler import DiscoveredPage, Form, FormField
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.csrf import CSRFCheck


@pytest.mark.asyncio
async def test_csrf_plugin():
    page = DiscoveredPage(
        "http://target.local/profile", 200, "text/html", {}, "",
        forms=[Form(action="/update", method="POST", fields=[FormField("email", "text")])]
    )
    check = CSRFCheck()

    async with ScopedHttpClient(ScopeValidator(["target.local"])) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "csrf"
    assert findings[0].parameter == "email"
