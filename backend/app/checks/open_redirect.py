from urllib.parse import urlencode, parse_qsl, urlparse, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class OpenRedirectCheck(ScanCheck):
    id = "open-redirect"
    name = "Open Redirect"
    severity = "medium"
    owasp_category = "A01:2025-Broken Access Control"
    payload = "http://evil.com"
    target_params = ["url", "redirect", "next", "return", "goto", "dest"]

    def applies_to(self, page: DiscoveredPage) -> bool:
        return bool(page.query_params)

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        parsed = urlparse(page.url)
        params = parse_qsl(parsed.query)

        for i, (key, val) in enumerate(params):
            if not any(t in key.lower() for t in self.target_params):
                continue

            test_params = params.copy()
            test_params[i] = (key, self.payload)
            test_url = urlunparse(parsed._replace(query=urlencode(test_params)))
            
            try:
                # Disable follow_redirects to inspect the initial 3xx response
                client._client.follow_redirects = False
                response = await client.get(test_url)
                
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("location", "")
                    if location == self.payload or location.startswith(self.payload):
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title="Open Redirect",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"Redirected to {self.payload}",
                                remediation="Validate redirect targets against a strict allowlist."
                            )
                        )
            except Exception:
                pass
            finally:
                if client._client:
                    client._client.follow_redirects = True

        return findings
