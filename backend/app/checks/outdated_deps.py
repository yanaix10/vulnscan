import re
from urllib.parse import urlparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class OutdatedDepsCheck(ScanCheck):
    id = "outdated-deps"
    name = "Vulnerable & Outdated Components"
    severity = "medium"
    owasp_category = "A06:2025-Vulnerable and Outdated Components"

    def __init__(self):
        self.tested_hosts: set[str] = set()

    def applies_to(self, page: DiscoveredPage) -> bool:
        parsed = urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        if host in self.tested_hosts:
            return False
        return True

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        parsed = urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        self.tested_hosts.add(host)

        headers = {k.lower(): v for k, v in page.headers.items()}

        # 1. Check Server banner version disclosure
        server_header = headers.get("server", "")
        if server_header and re.search(r"[\d\.]+", server_header):
            findings.append(
                Finding(
                    check_id=self.id,
                    title=f"Server Banner Version Disclosure ({server_header})",
                    severity="low",
                    url=page.url,
                    parameter="Server",
                    evidence=f"Server header exposes exact software version: '{server_header}'.",
                    remediation="Disable Server tokens in web server config (e.g., 'ServerTokens Prod' in Apache or 'server_tokens off' in Nginx)."
                )
            )

        # 2. Check X-Powered-By header
        powered_by = headers.get("x-powered-by", "")
        if powered_by:
            findings.append(
                Finding(
                    check_id=self.id,
                    title=f"Technology Stack Disclosure ({powered_by})",
                    severity="low",
                    url=page.url,
                    parameter="X-Powered-By",
                    evidence=f"X-Powered-By header leaks technology stack: '{powered_by}'.",
                    remediation="Remove the X-Powered-By header in your application or runtime (e.g., 'expose_php = Off' in php.ini)."
                )
            )

        # 3. Check for Outdated Frontend Libraries in HTML body
        jquery_match = re.search(r"jquery[.-]([0-9]+\.[0-9]+\.[0-9]+)", page.body, re.IGNORECASE)
        if jquery_match:
            version = jquery_match.group(1)
            parts = [int(p) for p in version.split(".") if p.isdigit()]
            if parts and (parts[0] < 3 or (parts[0] == 3 and len(parts) > 1 and parts[1] < 5)):
                findings.append(
                    Finding(
                        check_id=self.id,
                        title=f"Outdated jQuery Library Detected (v{version})",
                        severity=self.severity,
                        url=page.url,
                        parameter="<script>",
                        evidence=f"HTML scripts reference jQuery v{version}, which has known CVEs (CVE-2020-11022, CVE-2020-11023 XSS vulnerabilities).",
                        remediation="Upgrade jQuery to version 3.7.1 or higher, or migrate to modern standard DOM APIs."
                    )
                )

        return findings
