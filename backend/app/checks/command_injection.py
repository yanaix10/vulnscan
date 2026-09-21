import re
from urllib.parse import urlencode, parse_qsl, urlparse, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class CommandInjectionCheck(ScanCheck):
    id = "command-injection"
    name = "OS Command Injection"
    severity = "critical"
    owasp_category = "A05:2025-Injection"

    # Benign canary token to verify command execution without system modification
    CANARY_TOKEN = "VULNSCAN_CMDI_OK"
    PAYLOADS = [
        f"127.0.0.1; echo '{CANARY_TOKEN}'",
        f"127.0.0.1 && echo '{CANARY_TOKEN}'",
        f"127.0.0.1 | echo '{CANARY_TOKEN}'",
        f"; echo '{CANARY_TOKEN}' ;",
        f"| echo '{CANARY_TOKEN}'",
    ]

    target_keywords = {"ip", "host", "ping", "domain", "cmd", "exec", "target", "addr", "query", "run", "command"}

    def applies_to(self, page: DiscoveredPage) -> bool:
        return bool(page.query_params or page.forms)

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings: list[Finding] = []
        parsed = urlparse(page.url)
        params = parse_qsl(parsed.query)

        # 1. Test URL Query Parameters
        for i, (key, val) in enumerate(params):
            for payload in self.PAYLOADS:
                test_params = params.copy()
                test_params[i] = (key, payload)
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

                try:
                    res = await client.get(test_url)
                    if self._is_real_execution(res.text):
                        idx = res.text.find(self.CANARY_TOKEN)
                        snippet = res.text[max(0, idx - 40): min(len(res.text), idx + 80)].strip()
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title=f"OS Command Injection in parameter '{key}'",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"Canary token executed successfully. Terminal output snippet: '{snippet}'",
                                remediation="Avoid passing user input to system shells. Use language-native APIs with explicit argument lists (e.g., subprocess.run(['ping', '-c', '1', ip])) instead of shell execution."
                            )
                        )
                        break
                except Exception:
                    pass

        # 2. Test Discovered HTML Form Inputs
        for form in page.forms:
            form_params = {f.name: f.value or "127.0.0.1" for f in form.fields if f.name}
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

                        if self._is_real_execution(res.text):
                            idx = res.text.find(self.CANARY_TOKEN)
                            snippet = res.text[max(0, idx - 40): min(len(res.text), idx + 80)].strip()
                            findings.append(
                                Finding(
                                    check_id=self.id,
                                    title=f"OS Command Injection in form field '{field.name}'",
                                    severity=self.severity,
                                    url=form.action,
                                    parameter=field.name,
                                    evidence=f"Shell payload executed via {form.method} form submission. Terminal output excerpt: '{snippet}'",
                                    remediation="Do not invoke system shells with user-supplied arguments. Employ strict regex validation and parameterized execution."
                                )
                            )
                            break
                    except Exception:
                        pass

        return findings

    def _is_real_execution(self, text: str) -> bool:
        if self.CANARY_TOKEN not in text:
            return False
        # If the command string itself like "echo 'VULNSCAN_CMDI_OK'" is present, it's an unexecuted reflection
        if f"echo '{self.CANARY_TOKEN}'" in text or f'echo "{self.CANARY_TOKEN}"' in text:
            return False
        # If the canary token is reflected inside a DBMS syntax error message, it's an SQL error reflection, not shell execution
        lower = text.lower()
        if any(db in lower for db in ("syntax error", "mariadb", "mysql", "sqlite", "postgresql", "ora-")):
            for db in ("syntax error", "mariadb", "mysql", "sqlite", "postgresql"):
                if db in lower:
                    db_idx = lower.find(db)
                    token_idx = text.find(self.CANARY_TOKEN)
                    if abs(token_idx - db_idx) < 300:
                        return False
        return True
