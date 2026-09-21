from urllib.parse import urlencode, parse_qsl, urlparse, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class ReflectedXSSCheck(ScanCheck):
    id = "reflected-xss"
    name = "Reflected Cross-Site Scripting (XSS)"
    severity = "high"
    owasp_category = "A05:2025-Injection"
    
    # Primary probe matches test suite expectations; alternative probes test attribute breakout
    marker = "<script>alert('VULNSCAN')</script>"
    PAYLOADS = [
        "<script>alert('VULNSCAN')</script>",
        "\"><script>alert('VULNSCAN')</script>",
        "\"><img src=x onerror=alert('VULNSCAN')>"
    ]

    def applies_to(self, page: DiscoveredPage) -> bool:
        return bool(page.query_params or page.forms)

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings: list[Finding] = []
        parsed = urlparse(page.url)
        params = parse_qsl(parsed.query)

        # 1. Test URL query parameters
        for i, (key, val) in enumerate(params):
            for payload in self.PAYLOADS:
                test_params = params.copy()
                test_params[i] = (key, payload)
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

                try:
                    response = await client.get(test_url)
                    is_html = "text/html" in response.headers.get("content-type", "")
                    if payload in response.text and is_html:
                        # Extract 40 chars before and 60 chars after reflection
                        idx = response.text.find(payload)
                        snippet = response.text[max(0, idx - 40): min(len(response.text), idx + len(payload) + 40)].strip()
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title=f"Reflected XSS in parameter '{key}'",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"Payload reflected unescaped in HTML response. Context excerpt: '{snippet}'",
                                remediation="Contextually output-encode all user-supplied data prior to rendering in HTML body, attributes, or scripts. Enforce a strict Content-Security-Policy."
                            )
                        )
                        break
                except Exception:
                    pass

        # 2. Test discovered form inputs
        for form in page.forms:
            form_params = {f.name: f.value or "test" for f in form.fields if f.name}
            for field in form.fields:
                if not field.name or field.field_type in ("submit", "button", "hidden"):
                    continue

                for payload in self.PAYLOADS:
                    test_data = form_params.copy()
                    test_data[field.name] = payload
                    try:
                        if form.method == "POST":
                            res = await client.post(form.action, data=test_data)
                        else:
                            res = await client.get(form.action, params=test_data)

                        is_html = "text/html" in res.headers.get("content-type", "")
                        if payload in res.text and is_html:
                            idx = res.text.find(payload)
                            snippet = res.text[max(0, idx - 40): min(len(res.text), idx + len(payload) + 40)].strip()
                            findings.append(
                                Finding(
                                    check_id=self.id,
                                    title=f"Reflected XSS in form field '{field.name}'",
                                    severity=self.severity,
                                    url=form.action,
                                    parameter=field.name,
                                    evidence=f"Payload reflected unescaped via {form.method} form submission. Context excerpt: '{snippet}'",
                                    remediation="Apply HTML contextual encoding (e.g. htmlspecialchars() or UI framework auto-escaping) on all reflected form data."
                                )
                            )
                            break
                    except Exception:
                        pass

        return findings