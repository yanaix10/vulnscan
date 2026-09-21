from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class SSRFCheck(ScanCheck):
    id = "ssrf"
    name = "Server-Side Request Forgery (SSRF)"
    severity = "high"
    owasp_category = "A10:2025-Server-Side Request Forgery (SSRF)"
    
    target_params = {"url", "dest", "redirect", "uri", "feed", "webhook", "proxy", "api", "target", "path"}
    ssrf_payload = "http://127.0.0.1:80"

    def applies_to(self, page: DiscoveredPage) -> bool:
        if not page.query_params and not page.forms:
            return False
        qp_matches = any(p.lower() in self.target_params for p in page.query_params)
        form_matches = any(
            any(f.name.lower() in self.target_params for f in form.fields if f.name)
            for form in page.forms
        )
        return qp_matches or form_matches

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        parsed = urlparse(page.url)
        params = parse_qsl(parsed.query)

        # 1. Test Query Parameters
        for i, (key, val) in enumerate(params):
            if key.lower() in self.target_params:
                test_params = params.copy()
                test_params[i] = (key, self.ssrf_payload)
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))
                try:
                    res = await client.get(test_url)
                    # Detect internal reflections or loopback indicators
                    if ("apache" in res.text.lower() or "nginx" in res.text.lower() or res.status_code == 200) and self.ssrf_payload in res.text:
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title=f"Potential SSRF in query parameter '{key}'",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"Parameter '{key}' accepted loopback payload '{self.ssrf_payload}'. Response code: {res.status_code}.",
                                remediation="Validate and sanitize destination URLs against an allowlist of trusted domains. Disable HTTP redirects."
                            )
                        )
                except Exception:
                    pass

        # 2. Test Form Fields
        for form in page.forms:
            for field in form.fields:
                if field.name and field.name.lower() in self.target_params:
                    form_data = {f.name: f.value or "test" for f in form.fields if f.name}
                    form_data[field.name] = self.ssrf_payload
                    try:
                        if form.method == "POST":
                            res = await client.post(form.action, data=form_data)
                        else:
                            res = await client.get(form.action, params=form_data)
                        if self.ssrf_payload in res.text:
                            findings.append(
                                Finding(
                                    check_id=self.id,
                                    title=f"Potential SSRF in form field '{field.name}'",
                                    severity=self.severity,
                                    url=form.action,
                                    parameter=field.name,
                                    evidence=f"Form field '{field.name}' processed '{self.ssrf_payload}'. Status: {res.status_code}.",
                                    remediation="Enforce strict protocol and IP range restrictions (RFC 1918 blocking) on outbound requests."
                                )
                            )
                    except Exception:
                        pass

        return findings
