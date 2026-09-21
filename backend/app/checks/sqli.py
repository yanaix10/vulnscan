import re
from urllib.parse import urlencode, parse_qsl, urlparse, urlunparse
from app.checks.base import ScanCheck, Finding
from app.core.crawler import DiscoveredPage
from app.core.scope_validator import ScopedHttpClient


class SQLInjectionCheck(ScanCheck):
    id = "sqli"
    name = "SQL Injection (Error-Based)"
    severity = "critical"
    owasp_category = "A05:2025-Injection"

    PAYLOADS = ["'", '"']

    # Comprehensive DBMS signature patterns (MySQL, MariaDB, Postgres, SQLite, Oracle, MSSQL)
    DBMS_PATTERNS = [
        (re.compile(r"you have an error in your sql syntax[^<\n]*", re.IGNORECASE), "MySQL/MariaDB Syntax Error"),
        (re.compile(r"check the manual that corresponds to your (?:mysql|mariadb)[^<\n]*", re.IGNORECASE), "MariaDB/MySQL Version Query Error"),
        (re.compile(r"mysql_fetch_(?:array|assoc|row|object)[^<\n]*", re.IGNORECASE), "MySQL Driver Function Warning"),
        (re.compile(r"warning: mysql[^<\n]*", re.IGNORECASE), "PHP MySQL Driver Warning"),
        (re.compile(r"postgresql query failed[^<\n]*", re.IGNORECASE), "PostgreSQL Query Failure"),
        (re.compile(r"syntax error at or near [^<\n]*", re.IGNORECASE), "PostgreSQL Syntax Error"),
        (re.compile(r"pg_query\(\)[^<\n]*", re.IGNORECASE), "PHP PostgreSQL Driver Error"),
        (re.compile(r"sqlite3::query[^<\n]*", re.IGNORECASE), "SQLite Query Exception"),
        (re.compile(r"sqlite3\.operationalerror[^<\n]*", re.IGNORECASE), "Python SQLite Operational Error"),
        (re.compile(r"near \"[^\"]+\": syntax error", re.IGNORECASE), "SQLite Syntax Error"),
        (re.compile(r"unclosed quotation mark[^<\n]*", re.IGNORECASE), "SQL Server Unclosed Quotation Mark"),
        (re.compile(r"ora-[0-9]{4,5}[^<\n]*", re.IGNORECASE), "Oracle Database Error"),
        (re.compile(r"quoted string not properly terminated", re.IGNORECASE), "Oracle Syntax Error"),
        (re.compile(r"odbc sql server driver[^<\n]*", re.IGNORECASE), "ODBC SQL Server Driver Error"),
        (re.compile(r"syntax error", re.IGNORECASE), "Generic SQL Syntax Error")
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
                test_params[i] = (key, val + payload)
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

                try:
                    response = await client.get(test_url)
                    matched, error_name, snippet = self._find_db_error(response.text)
                    if matched or (response.status_code == 500 and "syntax error" in response.text.lower()):
                        findings.append(
                            Finding(
                                check_id=self.id,
                                title=f"SQL Injection in parameter '{key}' ({error_name})",
                                severity=self.severity,
                                url=page.url,
                                parameter=key,
                                evidence=f"Injected probe '{payload}'. Database returned {error_name}. Snippet: '{snippet}'",
                                remediation="Use parameterized queries (prepared statements) with bound variables across all database queries. Avoid string concatenation."
                            )
                        )
                        break
                except Exception:
                    pass

        # 2. Test discovered form inputs
        for form in page.forms:
            form_params = {f.name: f.value or "1" for f in form.fields if f.name}
            for field in form.fields:
                if not field.name or field.field_type in ("submit", "button", "hidden"):
                    continue

                for payload in self.PAYLOADS:
                    test_data = form_params.copy()
                    test_data[field.name] = (form_params.get(field.name, "1")) + payload
                    try:
                        if form.method == "POST":
                            res = await client.post(form.action, data=test_data)
                        else:
                            res = await client.get(form.action, params=test_data)

                        matched, error_name, snippet = self._find_db_error(res.text)
                        if matched or (res.status_code == 500 and "syntax error" in res.text.lower()):
                            findings.append(
                                Finding(
                                    check_id=self.id,
                                    title=f"SQL Injection in form field '{field.name}' ({error_name})",
                                    severity=self.severity,
                                    url=form.action,
                                    parameter=field.name,
                                    evidence=f"Form payload '{payload}' triggered {error_name} via {form.method}. Snippet: '{snippet}'",
                                    remediation="Implement prepared statements using parameterized queries. Never interpolate unsanitized user inputs into SQL commands."
                                )
                            )
                            break
                    except Exception:
                        pass

        return findings

    def _find_db_error(self, text: str) -> tuple[bool, str, str]:
        for pattern, name in self.DBMS_PATTERNS:
            match = pattern.search(text)
            if match:
                snippet = match.group(0)[:120].strip()
                return True, name, snippet
        return False, "Database Syntax Error", "Database error triggered by single quote."
