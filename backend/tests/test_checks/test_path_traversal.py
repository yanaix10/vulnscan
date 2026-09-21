import pytest
import respx
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.path_traversal import PathTraversalCheck


@pytest.mark.asyncio
@respx.mock
async def test_path_traversal_linux():
    respx.get("http://target.local/view").mock(return_value=respx.MockResponse(
        200,
        headers={"content-type": "text/html"},
        text="root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin"
    ))

    page = DiscoveredPage(
        url="http://target.local/view?page=home.php",
        status_code=200,
        content_type="text/html",
        headers={},
        body="",
        query_params=["page"]
    )
    check = PathTraversalCheck()
    assert check.applies_to(page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "path-traversal"
    assert findings[0].severity == "critical"
    assert findings[0].parameter == "page"
    assert "root:x:0:0:root" in findings[0].evidence
