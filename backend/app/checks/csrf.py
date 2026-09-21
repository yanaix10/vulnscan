from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class CSRFCheck(ScanCheck):
    id = "csrf"
    name = "Cross-Site Request Forgery (Missing Token)"
    severity = "medium"
    owasp_category = "A01:2025-Broken Access Control"
    token_names = ["csrf", "xsrf", "authenticity_token", "_csrf_token", "nonce", "user_token"]

    def applies_to(self, page: DiscoveredPage) -> bool:
        return any(f.method == "POST" for f in page.forms)

    async def run(self, page: DiscoveredPage, client: ScopedHttpClient) -> list[Finding]:
        findings = []
        
        for form in page.forms:
            if form.method != "POST":
                continue
            
            field_names = [f.name for f in form.fields if f.name]
            has_token = any(any(t in f.name.lower() for t in self.token_names) for f in form.fields if f.name)
            
            if not has_token:
                sensitive_fields = [fn for fn in field_names if any(s in fn.lower() for s in ("pass", "pwd", "email", "admin", "role", "transfer", "pay", "user"))]
                evidence_desc = f"POST form targeting '{form.action}' lacks an anti-CSRF synchronizer token."
                if sensitive_fields:
                    evidence_desc += f" High-risk input fields detected: {sensitive_fields}."
                    param_name = sensitive_fields[0]
                elif field_names:
                    evidence_desc += f" Form fields: {field_names}."
                    param_name = field_names[0]
                else:
                    evidence_desc += " Form has no named input fields."
                    param_name = "form_body"

                findings.append(
                    Finding(
                        check_id=self.id,
                        title=f"Missing CSRF Token in form '{form.action}'",
                        severity=self.severity,
                        url=page.url,
                        parameter=param_name,
                        evidence=evidence_desc,
                        remediation="Implement the Synchronizer Token Pattern on all state-changing POST forms and enforce 'SameSite=Lax' or 'SameSite=Strict' cookie attributes."
                    )
                )
                
        return findings
