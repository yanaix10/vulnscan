import re
from urllib.parse import urlparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class SensitiveFileExposureCheck(ScanCheck):
    id = "sensitive-file-exposure"
    name = "Sensitive File Exposure"
    severity = "high"
    owasp_category = "A02:2025-Security Misconfiguration"

    def applies_to(self, page: DiscoveredPage) -> bool:
        # Only run this check once per host, against the root URL
        parsed = urlparse(page.url)
        return page.url == f"{parsed.scheme}://{parsed.netloc}/"

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings: list[Finding] = []
        base_url = page.url.rstrip("/") + "/"

        # 1. Config & Version Control files
        standard_payloads = [
            (".env", "APP_KEY=", "Exposed .env file"),
            (".git/HEAD", "ref:", "Exposed .git/HEAD file"),
            (".git/config", "[remote", "Exposed .git/config file"),
        ]

        for payload, indicator, title in standard_payloads:
            target_url = f"{base_url}{payload}"
            try:
                response = await client.get(target_url)
                content = response.text
                if response.status_code == 200 and indicator in content:
                    findings.append(
                        Finding(
                            check_id=self.id,
                            title=title,
                            severity=self.severity,
                            url=target_url,
                            parameter=None,
                            evidence=f"Status 200. Snippet: {content[:80].strip()}",
                            remediation="Block web access to configuration files and version control directories in your web server configuration."
                        )
                    )
            except Exception:
                pass

        # 2. PHP Info Disclosure
        try:
            phpinfo_url = f"{base_url}phpinfo.php"
            res = await client.get(phpinfo_url)
            if res.status_code == 200 and ("PHP Version" in res.text or "<title>phpinfo()</title>" in res.text):
                # Extract PHP version string
                v_match = re.search(r"PHP Version ([0-9\.]+)", res.text)
                version_str = v_match.group(1) if v_match else "detected"
                findings.append(
                    Finding(
                        check_id=self.id,
                        title=f"PHP Information Disclosure (phpinfo.php v{version_str})",
                        severity=self.severity,
                        url=phpinfo_url,
                        parameter=None,
                        evidence=f"Exposed phpinfo() diagnostic page leaking PHP {version_str}, server modules, environment variables, and filesystem paths.",
                        remediation="Remove phpinfo.php and any debugging scripts from production web roots."
                    )
                )
        except Exception:
            pass

        # 3. Disallowed routes disclosure in robots.txt
        try:
            robots_url = f"{base_url}robots.txt"
            res = await client.get(robots_url)
            if res.status_code == 200 and "Disallow:" in res.text:
                disallowed = [
                    line.split(":", 1)[1].strip()
                    for line in res.text.splitlines()
                    if line.lower().startswith("disallow:") and line.split(":", 1)[1].strip() not in ("", "/")
                ]
                if disallowed:
                    findings.append(
                        Finding(
                            check_id=self.id,
                            title="Information Disclosure: Hidden Routes in robots.txt",
                            severity="low",
                            url=robots_url,
                            parameter="robots.txt",
                            evidence=f"Disallowed routes disclosed to crawlers: {', '.join(disallowed[:5])}",
                            remediation="Do not rely on robots.txt for access control. Protect administrative and staging paths with authentication."
                        )
                    )
        except Exception:
            pass

        return findings
