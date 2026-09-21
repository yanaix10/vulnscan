import pytest
import respx
from app.core.crawler import DiscoveredPage, Form, FormField
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.checks.command_injection import CommandInjectionCheck


@pytest.mark.asyncio
@respx.mock
async def test_command_injection_query_param():
    respx.get("http://target.local/ping").mock(return_value=respx.MockResponse(
        200,
        headers={"content-type": "text/html"},
        text="<pre>PING 127.0.0.1\nVULNSCAN_CMDI_OK\n</pre>"
    ))

    page = DiscoveredPage(
        url="http://target.local/ping?ip=127.0.0.1",
        status_code=200,
        content_type="text/html",
        headers={},
        body="<pre>PING 127.0.0.1</pre>",
        query_params=["ip"]
    )
    check = CommandInjectionCheck()
    assert check.applies_to(page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "command-injection"
    assert findings[0].severity == "critical"
    assert findings[0].parameter == "ip"
    assert "VULNSCAN_CMDI_OK" in findings[0].evidence


@pytest.mark.asyncio
@respx.mock
async def test_command_injection_form():
    respx.post("http://target.local/exec").mock(return_value=respx.MockResponse(
        200,
        headers={"content-type": "text/html"},
        text="<div>Output: VULNSCAN_CMDI_OK</div>"
    ))

    page = DiscoveredPage(
        url="http://target.local/tools",
        status_code=200,
        content_type="text/html",
        headers={},
        body="",
        forms=[Form(action="http://target.local/exec", method="POST", fields=[FormField("cmd", "text")])]
    )
    check = CommandInjectionCheck()
    assert check.applies_to(page)

    validator = ScopeValidator(["target.local"])
    async with ScopedHttpClient(validator) as client:
        findings = await check.run(page, client)

    assert len(findings) == 1
    assert findings[0].check_id == "command-injection"
    assert findings[0].parameter == "cmd"
