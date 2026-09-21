from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class InsecureCookiesCheck(ScanCheck):
    id = "insecure-cookies"
    name = "Insecure Cookie Attributes"
    severity = "medium"
    owasp_category = "A07:2025-Authentication Failures"

    def __init__(self):
        self.tested_cookies: set[str] = set()

    def applies_to(self, page: DiscoveredPage) -> bool:
        return any(k.lower() == "set-cookie" for k in page.headers.keys())

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        
        cookie_header = ""
        for k, v in page.headers.items():
            if k.lower() == "set-cookie":
                cookie_header = v
                break

        # Extract cookie name (e.g. PHPSESSID=...)
        cookie_name = cookie_header.split("=")[0].strip() if "=" in cookie_header else "session"
        if cookie_name.lower() in self.tested_cookies:
            return []
        self.tested_cookies.add(cookie_name.lower())

        cookie_lower = cookie_header.lower()
        if "httponly" not in cookie_lower:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Missing HttpOnly Flag",
                    severity=self.severity,
                    url=page.url,
                    parameter="Set-Cookie",
                    evidence=f"Cookie missing HttpOnly: {cookie_header[:50]}...",
                    remediation="Set the HttpOnly flag to prevent client-side scripts from reading the session cookie."
                )
            )

        if page.url.startswith("https") and "secure" not in cookie_lower:
            findings.append(
                Finding(
                    check_id=self.id,
                    title="Missing Secure Flag",
                    severity=self.severity,
                    url=page.url,
                    parameter="Set-Cookie",
                    evidence=f"Cookie missing Secure: {cookie_header[:50]}...",
                    remediation="Set the Secure flag to ensure the cookie is only transmitted over encrypted connections."
                )
            )

        return findings
