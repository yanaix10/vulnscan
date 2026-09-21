import json
import os
import tempfile
from app.checks.base import Finding
from app.reports.generator import ReportGenerator


def get_mock_findings():
    return [
        Finding(
            check_id="sqli",
            title="SQL Injection",
            severity="critical",
            url="http://target.local/api/users",
            parameter="id",
            evidence="Database syntax error triggered.",
            remediation="Use parameterized queries."
        ),
        Finding(
            check_id="security-headers",
            title="Missing CSP",
            severity="low",
            url="http://target.local/",
            parameter=None,
            evidence="CSP header missing.",
            remediation="Add CSP header."
        )
    ]


def test_json_generation():
    generator = ReportGenerator("http://target.local", get_mock_findings(), 4.5)
    output = generator.to_json()

    parsed = json.loads(output)
    assert parsed["target"] == "http://target.local"
    assert parsed["findings_count"] == 2
    assert parsed["duration_seconds"] == 4.5


def test_sarif_generation():
    generator = ReportGenerator("http://target.local", get_mock_findings())
    output = generator.to_sarif()

    parsed = json.loads(output)
    assert parsed["$schema"].endswith("sarif-schema-2.1.0.json")
    assert len(parsed["runs"][0]["results"]) == 2

    results = parsed["runs"][0]["results"]
    assert results[0]["level"] == "error"
    assert results[1]["level"] == "warning"


def test_html_generation():
    generator = ReportGenerator("http://target.local", get_mock_findings())

    with tempfile.TemporaryDirectory() as temp_dir:
        output_path = os.path.join(temp_dir, "report.html")
        generator.to_html(output_path)

        assert os.path.exists(output_path)
        with open(output_path, "r", encoding="utf-8") as f:
            content = f.read()

            assert "VulnScan Security Report" in content
            assert "SQL Injection" in content
            assert "Missing CSP" in content
