from urllib.parse import urlparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class WafDetectCheck(ScanCheck):
    id = "waf-detect"
    name = "Web Application Firewall (WAF) / IDS Detection"
    severity = "low"
    owasp_category = "A02:2025-Security Misconfiguration"

    def __init__(self):
        self.tested_hosts: set[str] = set()

    def applies_to(self, page: DiscoveredPage) -> bool:
        parsed = urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        if host in self.tested_hosts:
            return False
        return True

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings: list[Finding] = []
        parsed = urlparse(page.url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        self.tested_hosts.add(host)

        # Inspect headers and body for active defense signatures
        headers = {k.lower(): v for k, v in page.headers.items()}
        body = page.body.lower()

        # 1. PHPIDS (Damn Vulnerable Web App IDS module)
        if "hacking attempt detected and logged" in body:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Active Intrusion Detection System (PHPIDS) Detected",
                    severity=self.severity,
                    url=page.url,
                    parameter=None,
                    evidence="Target response contains PHPIDS block signature: 'Hacking attempt detected and logged. Have a nice day.'",
                    remediation="Auditing note: PHPIDS is filtering payloads. For comprehensive security assessments, ensure tests are run both with and without IDS filtering active."
                )
            )

        # 2. Cloudflare Protection
        if "cf-ray" in headers or "cloudflare" in headers.get("server", "").lower():
            if "attention required" in body or "cf-browser-verification" in body:
                findings.append(
                    Finding(
                        check_id=self.id,
                        title="Cloudflare WAF Interception Active",
                        severity=self.severity,
                        url=page.url,
                        parameter="cf-ray",
                        evidence=f"Cloudflare security challenge/WAF triggered. Ray ID: {headers.get('cf-ray', 'N/A')}",
                        remediation="Auditing note: Cloudflare WAF is actively challenging automated requests. Ensure test IP is allowlisted for audit accuracy."
                    )
                )

        # 3. AWS WAF
        if "x-amzn-waf-action" in headers or "x-amzn-errortype" in headers:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="AWS WAF Defense Active",
                    severity=self.severity,
                    url=page.url,
                    parameter="x-amzn-waf-action",
                    evidence=f"AWS WAF header present: {headers.get('x-amzn-waf-action', '')}",
                    remediation="Auditing note: AWS WAF is inspecting traffic. Ensure appropriate rate limits and rules are accounted for."
                )
            )

        # 4. ModSecurity / WebKnight
        if "mod_security" in headers.get("server", "").lower() or "modsecurity" in body:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="ModSecurity WAF Detected",
                    severity=self.severity,
                    url=page.url,
                    parameter="Server",
                    evidence="ModSecurity signature detected in HTTP headers or error response.",
                    remediation="Auditing note: ModSecurity OWASP Core Rule Set is inspecting requests."
                )
            )

        return findings
