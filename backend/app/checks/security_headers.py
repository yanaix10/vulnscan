import urllib.parse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class SecurityHeadersCheck(ScanCheck):
    id = "security-headers"
    name = "Missing Security Headers"
    severity = "low"
    owasp_category = "A02:2025-Security Misconfiguration"

    def __init__(self):
        self.tested_hosts: set[str] = set()

    def applies_to(self, page: DiscoveredPage) -> bool:
        if page.status_code != 200 or "text/html" not in page.content_type:
            return False
        parsed = urllib.parse.urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        if host in self.tested_hosts:
            return False
        return True

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        parsed = urllib.parse.urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        self.tested_hosts.add(host)

        headers = {k.lower(): v for k, v in page.headers.items()}

        if "content-security-policy" not in headers:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Missing Content-Security-Policy",
                    severity=self.severity,
                    url=page.url,
                    parameter=None,
                    evidence="Response headers do not contain Content-Security-Policy.",
                    remediation="Implement a strict CSP to mitigate Cross-Site Scripting (XSS)."
                )
            )

        if "x-frame-options" not in headers and "frame-ancestors" not in headers.get("content-security-policy", ""):
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Missing X-Frame-Options",
                    severity=self.severity,
                    url=page.url,
                    parameter=None,
                    evidence="Response headers lack X-Frame-Options.",
                    remediation="Set X-Frame-Options to DENY or SAMEORIGIN to prevent Clickjacking."
                )
            )

        if page.url.startswith("https") and "strict-transport-security" not in headers:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Missing HTTP Strict Transport Security (HSTS)",
                    severity=self.severity,
                    url=page.url,
                    parameter=None,
                    evidence="HTTPS endpoint does not enforce Strict-Transport-Security.",
                    remediation="Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to enforce encrypted connections."
                )
            )

        return findings
