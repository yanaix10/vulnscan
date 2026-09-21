"""
OWASP Top 10 & CWE Knowledge Base for VulnScan.
Enriches raw DAST findings with enterprise-grade threat intelligence,
CVSS metrics, impact analysis, and copy-pasteable remediation code.
"""

VULNERABILITY_KB = {
    "command-injection": {
        "name": "OS Command Injection (Remote Code Execution)",
        "owasp": "A03:2021 / A05:2025 – Injection",
        "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')",
        "cvss": "9.8 Critical (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
        "impact": "An attacker can execute arbitrary operating system commands with the privileges of the web application server process. This allows complete host compromise, lateral movement within the network, credential harvesting, and ransomware deployment.",
        "remediation_summary": "Never pass unvalidated user input directly to system shells (e.g. system(), exec(), shell_exec(), popen()). Use language-native APIs with explicit parameter lists.",
        "code_examples": {
            "php": (
                "// PHP Secure Execution without Shell\n"
                "$ip = filter_var($_POST['ip'], FILTER_VALIDATE_IP);\n"
                "if (!$ip) { throw new InvalidArgumentException('Invalid IP'); }\n"
                "// Use escapeshellcmd or preferably an exec array without shell evaluation\n"
                "$output = [];\n"
                "exec('ping -c 1 ' . escapeshellarg($ip), $output);"
            ),
            "python": (
                "# Python Subprocess (No shell=True)\n"
                "import subprocess\n"
                "# Pass arguments as a list to avoid invoking a system shell\n"
                "res = subprocess.run(['ping', '-c', '1', validated_ip], capture_output=True, text=True, check=True)"
            ),
            "nodejs": (
                "// Node.js child_process.execFile (No shell evaluation)\n"
                "const { execFile } = require('child_process');\n"
                "execFile('ping', ['-c', '1', validatedIp], (error, stdout) => {\n"
                "  console.log(stdout);\n"
                "});"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/78.html",
            "https://portswigger.net/web-security/os-command-injection"
        ]
    },
    "path-traversal": {
        "name": "Path Traversal / Local File Inclusion (LFI)",
        "owasp": "A01:2021 / A01:2025 – Broken Access Control",
        "cwe": "CWE-22: Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')",
        "cvss": "9.3 Critical (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)",
        "impact": "An attacker can navigate the local filesystem to read arbitrary sensitive files (such as /etc/passwd, database configurations, application source code, and cryptographic private keys) or execute local PHP files leading to Remote Code Execution.",
        "remediation_summary": "Use an allowlist of permitted filenames. If dynamic filenames are required, resolve the absolute path and ensure it starts with the authorized base directory.",
        "code_examples": {
            "php": (
                "// PHP Whitelist Pattern\n"
                "$allowed_pages = ['home.php', 'about.php', 'contact.php'];\n"
                "$page = basename($_GET['page']);\n"
                "if (!in_array($page, $allowed_pages, true)) {\n"
                "    http_response_code(400);\n"
                "    die('Access Denied');\n"
                "}\n"
                "include __DIR__ . '/pages/' . $page;"
            ),
            "python": (
                "# Python Path Traversal Defense\n"
                "import os\n"
                "BASE_DIR = os.path.abspath('/var/www/uploads')\n"
                "target = os.path.abspath(os.path.join(BASE_DIR, user_input))\n"
                "if not target.startswith(BASE_DIR):\n"
                "    raise PermissionError('Path traversal detected')"
            ),
            "nodejs": (
                "// Node.js Path Resolution Verification\n"
                "const path = require('path');\n"
                "const safePath = path.resolve(BASE_DIR, path.normalize(userInput));\n"
                "if (!safePath.startsWith(BASE_DIR)) {\n"
                "    throw new Error('Directory traversal attempt');\n"
                "}"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/File_Inclusion_Prevention_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/22.html",
            "https://portswigger.net/web-security/file-path-traversal"
        ]
    },
    "waf-detect": {
        "name": "Web Application Firewall (WAF) / IDS Detected",
        "owasp": "A02:2025 – Security Misconfiguration",
        "cwe": "CWE-693: Protection Mechanism Failure",
        "cvss": "3.1 Low (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N)",
        "impact": "An active defensive filter (such as PHPIDS, Cloudflare WAF, AWS WAF, or ModSecurity) is inspecting and filtering traffic. Automated scans may be partially blocked, yielding different results between external and internal assessments.",
        "remediation_summary": "Ensure security assessments are performed with explicit knowledge of WAF behavior. For thorough defense-in-depth reviews, perform audits behind the WAF as well as in front.",
        "code_examples": {},
        "references": [
            "https://owasp.org/www-community/Web_Application_Firewall",
            "https://cwe.mitre.org/data/definitions/693.html"
        ]
    },
    "sqli": {
        "name": "SQL Injection (SQLi)",
        "owasp": "A03:2021 / A05:2025 – Injection",
        "cwe": "CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')",
        "cvss": "9.8 Critical (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
        "impact": "An unauthorized attacker can bypass authentication mechanisms, read, extract, or corrupt the entire database, and potentially execute administrative database commands or take over the underlying host.",
        "remediation_summary": "Use parameterized queries (prepared statements) with bound variables. Never concatenate user-supplied input directly into SQL strings.",
        "code_examples": {
            "php": (
                "// PHP PDO Secure Prepared Statement\n"
                "$stmt = $pdo->prepare('SELECT * FROM accounts WHERE user_id = :id');\n"
                "$stmt->execute(['id' => $user_id]);\n"
                "$account = $stmt->fetch();"
            ),
            "python": (
                "# Python SQLAlchemy / Parameterized Query\n"
                "stmt = text('SELECT * FROM accounts WHERE user_id = :id')\n"
                "result = session.execute(stmt, {'id': user_id})"
            ),
            "nodejs": (
                "// Node.js PostgreSQL / pg Parameterized Query\n"
                "const result = await pool.query(\n"
                "  'SELECT * FROM accounts WHERE user_id = $1',\n"
                "  [userId]\n"
                ");"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/89.html",
            "https://portswigger.net/web-security/sql-injection"
        ]
    },
    "reflected-xss": {
        "name": "Reflected Cross-Site Scripting (XSS)",
        "owasp": "A03:2021 / A05:2025 – Injection",
        "cwe": "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        "cvss": "7.2 High (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N)",
        "impact": "An attacker can trick victims into clicking a malicious link, executing arbitrary JavaScript in their browser context to hijack active session cookies, steal credentials, or deface the application.",
        "remediation_summary": "Contextually HTML-encode user input before rendering. Use modern UI frameworks that auto-escape (React/Angular) and enforce a strict Content-Security-Policy.",
        "code_examples": {
            "php": (
                "// PHP Contextual HTML Escaping\n"
                "echo htmlspecialchars($user_input, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');"
            ),
            "python": (
                "# Jinja2 Template (Auto-Escaping)\n"
                "{{ user_input | e }}"
            ),
            "nodejs": (
                "// Express / Helmet Content-Security-Policy\n"
                "app.use(helmet.contentSecurityPolicy({\n"
                "  directives: { defaultSrc: [\"'self'\"] }\n"
                "}));"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/79.html",
            "https://portswigger.net/web-security/cross-site-scripting"
        ]
    },
    "csrf": {
        "name": "Cross-Site Request Forgery (CSRF)",
        "owasp": "A01:2021 / A01:2025 – Broken Access Control",
        "cwe": "CWE-352: Cross-Site Request Forgery (CSRF)",
        "cvss": "6.5 Medium (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N)",
        "impact": "An attacker can force an authenticated user into silently submitting unauthorized state-changing requests (such as transferring funds or changing email/passwords) without their knowledge.",
        "remediation_summary": "Implement the Synchronizer Token Pattern (anti-CSRF tokens in all POST/PUT/DELETE forms) and set session cookies with 'SameSite=Lax' or 'SameSite=Strict'.",
        "code_examples": {
            "html": (
                "<!-- HTML Anti-CSRF Synchronizer Token -->\n"
                "<form action=\"/account/update\" method=\"POST\">\n"
                "  <input type=\"hidden\" name=\"csrf_token\" value=\"{{ session.csrf_token }}\">\n"
                "  <button type=\"submit\">Save</button>\n"
                "</form>"
            ),
            "php": (
                "// PHP Session SameSite Cookie Directive\n"
                "session_set_cookie_params([\n"
                "  'samesite' => 'Lax',\n"
                "  'secure' => true,\n"
                "  'httponly' => true\n"
                "]);"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/352.html"
        ]
    },
    "open-redirect": {
        "name": "Unvalidated URL Redirection (Open Redirect)",
        "owasp": "A01:2021 / A01:2025 – Broken Access Control",
        "cwe": "CWE-601: URL Redirection to Untrusted Site ('Open Redirect')",
        "cvss": "6.1 Medium (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N)",
        "impact": "Attackers leverage the application's trusted domain to forward victims to malicious credential-harvesting phishing portals or OAuth token leak destinations.",
        "remediation_summary": "Avoid accepting arbitrary redirection URLs from user input. Validate destination URLs against a strict allowlist of authorized hosts or relative paths.",
        "code_examples": {
            "python": (
                "# Python URL Validation\n"
                "ALLOWED_HOSTS = {'app.example.com', 'localhost'}\n"
                "parsed = urllib.parse.urlparse(target_url)\n"
                "if parsed.netloc not in ALLOWED_HOSTS and not target_url.startswith('/'):\n"
                "    raise HTTPException(status_code=400, detail='Invalid redirect target')"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/601.html"
        ]
    },
    "sensitive-file-exposure": {
        "name": "Sensitive File & Configuration Exposure",
        "owasp": "A05:2021 / A02:2025 – Security Misconfiguration",
        "cwe": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
        "cvss": "7.5 High (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)",
        "impact": "Exposed `.env`, `.git`, or backup files leak database credentials, secret cryptographic keys, and source code repository structure to the public internet.",
        "remediation_summary": "Configure the web server to explicitly deny web access to hidden files and version control metadata directories (`.git`, `.env`).",
        "code_examples": {
            "nginx": (
                "# Nginx Block Dot-Files\n"
                "location ~ /\\.(?!well-known) {\n"
                "    deny all;\n"
                "    return 404;\n"
                "}"
            ),
            "apache": (
                "# Apache .htaccess\n"
                "<FilesMatch \"^\\.\">\n"
                "    Require all denied\n"
                "</FilesMatch>"
            )
        },
        "references": [
            "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
            "https://cwe.mitre.org/data/definitions/200.html"
        ]
    },
    "security-headers": {
        "name": "Missing Defensive Security Headers",
        "owasp": "A05:2021 / A02:2025 – Security Misconfiguration",
        "cwe": "CWE-693: Protection Mechanism Failure",
        "cvss": "3.7 Low (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N)",
        "impact": "Without browser security headers, client browsers cannot defend against Clickjacking, MIME-type sniffing, or unauthorized script injection.",
        "remediation_summary": "Deploy Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, and Strict-Transport-Security (HSTS) headers across all responses.",
        "code_examples": {
            "nginx": (
                "# Nginx Security Headers\n"
                "add_header Content-Security-Policy \"default-src 'self';\" always;\n"
                "add_header X-Frame-Options \"SAMEORIGIN\" always;\n"
                "add_header X-Content-Type-Options \"nosniff\" always;\n"
                "add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;"
            ),
            "apache": (
                "# Apache Security Headers\n"
                "Header always set X-Frame-Options \"SAMEORIGIN\"\n"
                "Header always set X-Content-Type-Options \"nosniff\"\n"
                "Header always set Content-Security-Policy \"default-src 'self';\""
            )
        },
        "references": [
            "https://owasp.org/www-project-secure-headers/",
            "https://cwe.mitre.org/data/definitions/693.html"
        ]
    },
    "insecure-cookies": {
        "name": "Insecure Cookie Flags (Missing HttpOnly / Secure / SameSite)",
        "owasp": "A07:2021 / A07:2025 – Authentication Failures",
        "cwe": "CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute",
        "cvss": "5.3 Medium (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)",
        "impact": "Session tokens lacking HttpOnly can be stolen via XSS. Cookies lacking Secure can be sniffed over plaintext HTTP connections.",
        "remediation_summary": "Ensure all authentication cookies enforce 'HttpOnly', 'Secure', and 'SameSite=Lax'.",
        "code_examples": {
            "php": (
                "# php.ini or session header\n"
                "session.cookie_httponly = 1\n"
                "session.cookie_secure = 1\n"
                "session.cookie_samesite = Lax"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/614.html"
        ]
    },
    "ssrf": {
        "name": "Server-Side Request Forgery (SSRF)",
        "owasp": "A10:2021 / A10:2025 – Server-Side Request Forgery",
        "cwe": "CWE-918: Server-Side Request Forgery (SSRF)",
        "cvss": "8.6 High (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N)",
        "impact": "The backend server can be coerced into contacting internal services, reading cloud instance metadata (e.g. AWS 169.254.169.254 credentials), or port scanning internal subnets.",
        "remediation_summary": "Enforce strict IP address validation. Reject private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16).",
        "code_examples": {
            "python": (
                "# Python IP Validation against Private Subnets\n"
                "import ipaddress, socket\n"
                "ip = socket.gethostbyname(target_hostname)\n"
                "if ipaddress.ip_address(ip).is_private or ipaddress.ip_address(ip).is_loopback:\n"
                "    raise ValueError('Private / internal addresses prohibited')"
            )
        },
        "references": [
            "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
            "https://cwe.mitre.org/data/definitions/918.html"
        ]
    },
    "outdated-deps": {
        "name": "Vulnerable & Outdated Third-Party Components",
        "owasp": "A06:2021 / A06:2025 – Vulnerable and Outdated Components",
        "cwe": "CWE-1104: Use of Unmaintained Third Party Components",
        "cvss": "7.5 High (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)",
        "impact": "Running unpatched server software or vulnerable client-side libraries exposes the platform to known public CVE exploits.",
        "remediation_summary": "Audit dependencies and update outdated web server banners, packages, and frameworks to stable, actively supported releases.",
        "code_examples": {
            "bash": (
                "# Continuous Dependency Auditing\n"
                "npm audit\n"
                "pip-audit"
            )
        },
        "references": [
            "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/",
            "https://cwe.mitre.org/data/definitions/1104.html"
        ]
    }
}


def get_finding_kb(check_id: str) -> dict:
    """Returns normalized KB entry for a check identifier."""
    # Normalize ID (e.g. 'command_injection' -> 'command-injection', 'xss' -> 'reflected-xss')
    norm = check_id.lower().replace("_", "-")
    if norm == "xss":
        norm = "reflected-xss"
    return VULNERABILITY_KB.get(norm, {
        "name": check_id,
        "owasp": "OWASP Top 10 Security Issue",
        "cwe": "CWE-General: Web Security Vulnerability",
        "cvss": "5.0 Medium",
        "impact": "Security anomaly detected on the target endpoint.",
        "remediation_summary": "Follow defense-in-depth secure coding standards.",
        "code_examples": {},
        "references": ["https://owasp.org/Top10/"]
    })
