import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.reports.knowledge import get_finding_kb


class ReportGenerator:
    """Generates scan reports in JSON, SARIF, and HTML formats."""

    def __init__(self, target_url: str, findings: list[Any], scan_duration: float = 0.0):
        self.target_url = target_url
        self.findings = findings
        self.scan_duration = scan_duration
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def _finding_to_dict(self, finding: Any) -> dict[str, Any]:
        """Normalizes finding with full OWASP, CWE, and CVSS threat intelligence."""
        if hasattr(finding, "__dict__"):
            data = dict(finding.__dict__)
            data.pop("_sa_instance_state", None)
        else:
            data = dict(finding)

        check_id = data.get("check_id", "vulnerability")
        kb = get_finding_kb(check_id)

        data["name"] = kb["name"]
        data["owasp_category"] = kb["owasp"]
        data["cwe"] = kb["cwe"]
        data["cvss"] = kb["cvss"]
        data["impact"] = kb["impact"]
        data["code_examples"] = kb.get("code_examples", {})
        data["references"] = kb.get("references", [])
        return data

    def to_json(self) -> str:
        """Exports raw findings to standard JSON."""
        enriched = [self._finding_to_dict(f) for f in self.findings]
        data = {
            "target": self.target_url,
            "timestamp": self.timestamp,
            "duration_seconds": round(self.scan_duration, 2),
            "findings_count": len(self.findings),
            "findings": enriched,
        }
        return json.dumps(data, indent=2)

    def to_sarif(self) -> str:
        """Exports findings to SARIF format for CI/CD integration."""
        results: list[dict[str, Any]] = []

        for finding in self.findings:
            severity = getattr(finding, "severity", "medium").lower()
            level = "warning"
            if severity in ("high", "critical"):
                level = "error"
            elif severity == "info":
                level = "note"

            title = getattr(finding, "title", getattr(finding, "check_id", "Finding"))
            evidence = getattr(finding, "evidence", "")
            remediation = getattr(finding, "remediation", "")
            check_id = getattr(finding, "check_id", "vulnerability")
            url = getattr(finding, "url", self.target_url)

            kb = get_finding_kb(check_id)

            results.append({
                "ruleId": check_id,
                "level": level,
                "message": {
                    "text": f"[{kb['owasp']}] {title}: {evidence}\nRemediation: {remediation}"
                },
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": url
                        }
                    }
                }]
            })

        sarif_data = {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "VulnScan DAST Enterprise",
                        "informationUri": "https://owasp.org",
                        "rules": []
                    }
                },
                "results": results
            }]
        }
        return json.dumps(sarif_data, indent=2)

    def to_html(self, output_path: Optional[str] = None) -> str:
        """Renders an enterprise HTML report using Jinja2."""
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(["html", "xml", "jinja2"])
        )
        env.globals["getattr"] = getattr
        env.globals["get_finding_kb"] = get_finding_kb

        template = env.get_template("report.html.jinja2")

        # Group findings by check_id
        checks_map: dict[str, dict[str, Any]] = {}
        for f in self.findings:
            cid = getattr(f, "check_id", "unknown")
            kb = get_finding_kb(cid)
            sev = getattr(f, "severity", "medium").lower()
            if cid not in checks_map:
                raw_rem = getattr(f, "remediation", None) or kb.get("remediation_summary", "")
                clean_rem = re.sub(r"^\s*(?:\*\*)?Remediation:(?:\*\*)?\s*", "", raw_rem, flags=re.IGNORECASE).strip() if raw_rem else ""
                checks_map[cid] = {
                    "check_id": cid,
                    "name": getattr(f, "title", None) or kb.get("name", cid),
                    "severity": sev,
                    "cvss": kb.get("cvss", "5.0 Medium"),
                    "owasp_category": kb.get("owasp", "A05:2021 Security Misconfiguration"),
                    "cwe_id": kb.get("cwe", "CWE-693"),
                    "impact": kb.get("impact", ""),
                    "remediation": clean_rem,
                    "code_examples": kb.get("code_examples", {}),
                    "references": kb.get("references", []),
                    "affected": [],
                }
            checks_map[cid]["affected"].append({
                "url": getattr(f, "url", ""),
                "parameter": getattr(f, "parameter", None),
                "evidence": getattr(f, "evidence", "")
            })

        grouped_by_severity: dict[str, list[dict[str, Any]]] = {
            "critical": [], "high": [], "medium": [], "low": [], "info": []
        }
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in self.findings:
            sev = getattr(f, "severity", "medium").lower()
            if sev in severity_counts:
                severity_counts[sev] += 1
            else:
                severity_counts["info"] += 1

        for check in checks_map.values():
            s = check["severity"]
            if s in grouped_by_severity:
                grouped_by_severity[s].append(check)
            else:
                grouped_by_severity.setdefault("info", []).append(check)

        html_content = template.render(
            target=self.target_url,
            timestamp=self.timestamp,
            duration=round(self.scan_duration, 2),
            total_findings=len(self.findings),
            grouped_findings=grouped_by_severity,
            severity_counts=severity_counts,
        )

        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(html_content)

        return html_content
