import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ShieldAlert, 
  FileCode, 
  CheckCircle2, 
  Globe, 
  Terminal,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Code,
  Layers,
  BookOpen
} from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { getFinding } from "../../api/findings";

// Enterprise OWASP & CWE Knowledge Base
const VULNERABILITY_DETAILS = {
  sqli: {
    name: "SQL Injection (SQLi)",
    owasp: "A03:2021 / A05:2025 – Injection",
    cwe: "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
    cvss: "9.8 Critical",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    impact: "An attacker can bypass authentication, read, extract, or corrupt the entire database, and potentially execute administrative database commands or take over the underlying host.",
    remediation: "Use parameterized queries (prepared statements) with bound variables. Never concatenate user-supplied input directly into SQL strings.",
    codeExamples: [
      {
        lang: "PHP (PDO)",
        code: "// Secure PDO Prepared Statement\n$stmt = $pdo->prepare('SELECT * FROM accounts WHERE user_id = :id');\n$stmt->execute(['id' => $userId]);\n$account = $stmt->fetch();"
      },
      {
        lang: "Python (SQLAlchemy)",
        code: "# Parameterized Query with SQLAlchemy\nstmt = text('SELECT * FROM accounts WHERE user_id = :id')\nresult = session.execute(stmt, {'id': user_id})"
      },
      {
        lang: "Node.js (pg)",
        code: "// Parameterized Query with pg pool\nconst result = await pool.query(\n  'SELECT * FROM accounts WHERE user_id = $1',\n  [userId]\n);"
      }
    ],
    references: [
      { name: "OWASP SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
      { name: "CWE-89 Official Mitre Definition", url: "https://cwe.mitre.org/data/definitions/89.html" },
      { name: "PortSwigger Web Security Academy: SQLi", url: "https://portswigger.net/web-security/sql-injection" }
    ]
  },
  xss: {
    name: "Reflected Cross-Site Scripting (XSS)",
    owasp: "A03:2021 / A05:2025 – Injection",
    cwe: "CWE-79: Improper Neutralization of Input During Web Page Generation",
    cvss: "7.2 High",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    impact: "An attacker can execute arbitrary JavaScript in the victim's browser context to hijack active session cookies, steal credentials, perform actions on the victim's behalf, or inject credential harvesting phishes.",
    remediation: "Contextually HTML-encode user input before rendering. Use modern UI frameworks that auto-escape by default and enforce a strict Content-Security-Policy.",
    codeExamples: [
      {
        lang: "PHP",
        code: "// Contextual HTML Escaping\necho htmlspecialchars($userInput, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');"
      },
      {
        lang: "Express.js / Helmet",
        code: "// Enforce Strict CSP with Helmet\napp.use(helmet.contentSecurityPolicy({\n  directives: { defaultSrc: [\"'self'\"] }\n}));"
      }
    ],
    references: [
      { name: "OWASP XSS Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
      { name: "CWE-79 Official Mitre Definition", url: "https://cwe.mitre.org/data/definitions/79.html" }
    ]
  },
  csrf: {
    name: "Cross-Site Request Forgery (CSRF)",
    owasp: "A01:2021 / A01:2025 – Broken Access Control",
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
    cvss: "6.5 Medium",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N",
    impact: "An attacker can trick an authenticated victim into submitting unauthorized state-changing requests (such as transferring funds, changing email/passwords, or updating settings) without their knowledge.",
    remediation: "Implement the Synchronizer Token Pattern (Anti-CSRF tokens in all POST/PUT forms) and configure session cookies with 'SameSite=Lax' or 'SameSite=Strict'.",
    codeExamples: [
      {
        lang: "HTML Form Token",
        code: "<!-- Include Synchronizer Token in POST forms -->\n<form action=\"/settings\" method=\"POST\">\n  <input type=\"hidden\" name=\"csrf_token\" value=\"{{ session.csrf_token }}\">\n  <button type=\"submit\">Save</button>\n</form>"
      },
      {
        lang: "PHP / Cookie",
        code: "// Set SameSite Attribute on Session Cookies\nsession_set_cookie_params([\n  'samesite' => 'Lax',\n  'secure' => true,\n  'httponly' => true\n]);"
      }
    ],
    references: [
      { name: "OWASP CSRF Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html" },
      { name: "CWE-352 Official Mitre Definition", url: "https://cwe.mitre.org/data/definitions/352.html" }
    ]
  },
  security_headers: {
    name: "Missing Defensive Security Headers",
    owasp: "A05:2021 / A02:2025 – Security Misconfiguration",
    cwe: "CWE-693: Protection Mechanism Failure",
    cvss: "3.7 Low",
    cvssVector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
    impact: "Without browser security headers, client browsers cannot defend against Clickjacking, MIME-type sniffing, or unauthorized script injection.",
    remediation: "Deploy Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, and Strict-Transport-Security (HSTS) headers across all HTTP responses.",
    codeExamples: [
      {
        lang: "Nginx",
        code: "# Nginx Configuration\nadd_header Content-Security-Policy \"default-src 'self';\" always;\nadd_header X-Frame-Options \"SAMEORIGIN\" always;\nadd_header X-Content-Type-Options \"nosniff\" always;\nadd_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;"
      },
      {
        lang: "Apache",
        code: "# Apache .htaccess\nHeader always set X-Frame-Options \"SAMEORIGIN\"\nHeader always set X-Content-Type-Options \"nosniff\"\nHeader always set Content-Security-Policy \"default-src 'self';\""
      }
    ],
    references: [
      { name: "OWASP Secure Headers Project", url: "https://owasp.org/www-project-secure-headers/" },
      { name: "CWE-693 Protection Mechanism Failure", url: "https://cwe.mitre.org/data/definitions/693.html" }
    ]
  },
  insecure_cookies: {
    name: "Insecure Cookie Attributes",
    owasp: "A07:2021 / A07:2025 – Authentication Failures",
    cwe: "CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute",
    cvss: "5.3 Medium",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    impact: "Session tokens lacking HttpOnly can be stolen via XSS. Cookies lacking Secure can be intercepted over plaintext HTTP connections.",
    remediation: "Configure the server or framework to append '; HttpOnly', '; Secure', and '; SameSite=Lax' to all session cookies.",
    codeExamples: [
      {
        lang: "php.ini",
        code: "session.cookie_httponly = 1\nsession.cookie_secure = 1\nsession.cookie_samesite = Lax"
      }
    ],
    references: [
      { name: "OWASP Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html" }
    ]
  },
  sensitive_files: {
    name: "Sensitive Configuration File Exposure",
    owasp: "A05:2021 / A02:2025 – Security Misconfiguration",
    cwe: "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
    cvss: "7.5 High",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
    impact: "Exposed configuration files or Git metadata leak database credentials, secret cryptographic keys, and source code directly to attackers.",
    remediation: "Block web access to dotfiles and configuration directories in your web server configuration.",
    codeExamples: [
      {
        lang: "Nginx",
        code: "location ~ /\\.(?!well-known) {\n    deny all;\n    return 404;\n}"
      }
    ],
    references: [
      { name: "CWE-200 Sensitive Information Exposure", url: "https://cwe.mitre.org/data/definitions/200.html" }
    ]
  },
  ssrf: {
    name: "Server-Side Request Forgery (SSRF)",
    owasp: "A10:2021 / A10:2025 – Server-Side Request Forgery",
    cwe: "CWE-918: Server-Side Request Forgery (SSRF)",
    cvss: "8.6 High",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N",
    impact: "The server can be coerced into contacting internal infrastructure, accessing cloud instance metadata (169.254.169.254), or scanning internal networks.",
    remediation: "Enforce strict allowlists on destination domains and prohibit outbound connections to private RFC 1918 subnets.",
    codeExamples: [],
    references: [
      { name: "OWASP SSRF Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" }
    ]
  },
  command_injection: {
    name: "OS Command Injection (Remote Code Execution)",
    owasp: "A03:2021 / A05:2025 – Injection",
    cwe: "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
    cvss: "9.8 Critical",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    impact: "An attacker can execute arbitrary operating system commands with server privileges, gaining full shell access, reading sensitive credentials, or pivoting internally through the private network.",
    remediation: "Do not pass user inputs to system shells (e.g. system(), exec(), popen()). Use language-native APIs with explicit parameter lists instead of shell string evaluation.",
    codeExamples: [
      {
        lang: "PHP",
        code: "// Safe Execution in PHP without Shell\n$ip = filter_var($_POST['ip'], FILTER_VALIDATE_IP);\nif (!$ip) { throw new InvalidArgumentException('Invalid IP'); }\n$output = [];\nexec('ping -c 1 ' . escapeshellarg($ip), $output);"
      },
      {
        lang: "Python",
        code: "# Safe Subprocess Execution (shell=False)\nimport subprocess\nres = subprocess.run(['ping', '-c', '1', validated_ip], capture_output=True, text=True, check=True)"
      },
      {
        lang: "Node.js",
        code: "// child_process.execFile (No shell evaluation)\nconst { execFile } = require('child_process');\nexecFile('ping', ['-c', '1', validatedIp], (err, stdout) => { console.log(stdout); });"
      }
    ],
    references: [
      { name: "OWASP Command Injection Defense Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html" },
      { name: "CWE-78 Official Mitre Definition", url: "https://cwe.mitre.org/data/definitions/78.html" },
      { name: "PortSwigger Web Security Academy: Command Injection", url: "https://portswigger.net/web-security/os-command-injection" }
    ]
  },
  path_traversal: {
    name: "Path Traversal / Local File Inclusion (LFI)",
    owasp: "A01:2021 / A01:2025 – Broken Access Control",
    cwe: "CWE-22: Improper Limitation of a Pathname to a Restricted Directory",
    cvss: "9.3 Critical",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    impact: "An attacker can navigate the server filesystem to read arbitrary files (including /etc/passwd, database configurations, and source code) or execute malicious local files.",
    remediation: "Validate inputs against a strict allowlist of authorized filenames, or verify that resolved canonical paths strictly begin with the authorized base directory.",
    codeExamples: [
      {
        lang: "PHP",
        code: "// Allowlist-based Inclusion\n$allowed = ['home.php', 'about.php', 'contact.php'];\n$page = basename($_GET['page']);\nif (!in_array($page, $allowed, true)) { die('Unauthorized'); }\ninclude __DIR__ . '/pages/' . $page;"
      },
      {
        lang: "Python",
        code: "# Canonical Path Verification\nimport os\nbase = os.path.abspath('/var/www/uploads')\ntarget = os.path.abspath(os.path.join(base, user_file))\nif not target.startswith(base): raise PermissionError('Traversal detected')"
      }
    ],
    references: [
      { name: "OWASP File Inclusion Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Inclusion_Prevention_Cheat_Sheet.html" },
      { name: "CWE-22 Official Mitre Definition", url: "https://cwe.mitre.org/data/definitions/22.html" }
    ]
  },
  waf_detect: {
    name: "Web Application Firewall (WAF) / IDS Active",
    owasp: "A02:2025 – Security Misconfiguration",
    cwe: "CWE-693: Protection Mechanism Failure",
    cvss: "3.1 Low",
    cvssVector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
    impact: "An active defensive filter (such as PHPIDS, Cloudflare, or AWS WAF) is inspecting and intercepting payloads.",
    remediation: "Coordinate automated security audits to test both in front of and behind defensive WAF proxies.",
    codeExamples: [],
    references: [
      { name: "OWASP WAF Guidelines", url: "https://owasp.org/www-community/Web_Application_Firewall" }
    ]
  },
  outdated_deps: {
    name: "Vulnerable and Outdated Components",
    owasp: "A06:2021 / A06:2025 – Vulnerable Components",
    cwe: "CWE-1104: Use of Unmaintained Third Party Components",
    cvss: "7.5 High",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
    impact: "Exposes the application to known public vulnerabilities and automated exploitation targeting outdated server software or JS packages.",
    remediation: "Audit and update packages, hide server version banners, and establish automated dependency patch management.",
    codeExamples: [],
    references: [
      { name: "OWASP Outdated Components", url: "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/" }
    ]
  }
};

export function FindingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState(0);

  useEffect(() => {
    async function loadFinding() {
      try {
        setLoading(true);
        const data = await getFinding(id);
        setFinding(data);
      } catch (err) {
        setError(err.message || "Finding not found");
      } finally {
        setLoading(false);
      }
    }
    loadFinding();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-mono text-sm text-muted-foreground">Loading finding analysis #{id}...</p>
      </div>
    );
  }

  if (error || !finding) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Finding Not Found</h3>
        <p className="text-sm text-muted-foreground font-mono">{error || "Could not locate finding."}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back to Findings
        </Button>
      </div>
    );
  }

  const normKey = (finding.check_id || "").toLowerCase().replace(/-/g, "_");
  const details = VULNERABILITY_DETAILS[normKey] || VULNERABILITY_DETAILS[normKey.replace("reflected_", "")] || {
    name: finding.check_id.toUpperCase(),
    owasp: "OWASP Top 10 Security Issue",
    cwe: "CWE-General: Web Security Defect",
    cvss: "5.0 Medium",
    impact: "Security anomaly detected on the target endpoint during DAST fuzzing.",
    remediation: finding.remediation || "Follow security standard input validation and defense-in-depth sanitization.",
    codeExamples: [],
    references: []
  };

  const getSeverityBorder = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical": return "border-l-4 border-l-red-600";
      case "high": return "border-l-4 border-l-orange-500";
      case "medium": return "border-l-4 border-l-amber-500";
      case "low": return "border-l-4 border-l-blue-500";
      default: return "border-l-4 border-l-slate-500";
    }
  };

  const getSeverityBadgeVariant = (sev) => {
    const s = (sev || "").toLowerCase();
    if (s === "critical" || s === "high") return "destructive";
    if (s === "medium") return "secondary";
    return "outline";
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Findings
      </button>

      {/* Main Advisory Card */}
      <div className={`p-6 md:p-8 rounded-2xl bg-card border border-border space-y-6 shadow-xl ${getSeverityBorder(finding.severity)}`}>
        
        {/* Requirement 6 - Line 1 & Line 2 Hierarchy */}
        <div className="border-b border-border/80 pb-5 space-y-2">
          {/* Line 1: severity Badge (short label) + finding title (largest text) + CVSS score right-aligned */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={getSeverityBadgeVariant(finding.severity)} className="font-mono text-xs font-bold uppercase tracking-wider">
                {(finding.severity || "INFO").toUpperCase()}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                {details.name}
              </h1>
            </div>

            <div className="font-mono text-xs font-semibold text-muted-foreground bg-muted/60 border border-border px-3 py-1.5 rounded-lg">
              {details.cvss.split(" ")[0]} CVSS
            </div>
          </div>

          {/* Line 2, smaller and muted: OWASP category + CWE ID as plain text, not badges */}
          <div className="text-sm text-muted-foreground font-sans pt-1">
            {details.owasp} · {details.cwe.split(":")[0]}
          </div>
        </div>

        {/* Labeled-Field Layout (label above value) for Endpoint / Parameter / CWE Definition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              Endpoint
            </span>
            <div className="font-mono text-xs text-foreground break-all">
              <a 
                href={finding.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline underline-offset-2"
              >
                {finding.url}
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              Parameter
            </span>
            <div className="font-mono text-xs text-amber-400 font-semibold break-all">
              {finding.parameter || "— (Host Header / URL Root)"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              CWE Definition
            </span>
            <div className="font-mono text-xs text-foreground truncate">
              {details.cwe}
            </div>
          </div>
        </div>

        {/* Technical Evidence & Proof-of-Concept Block */}
        <div className="space-y-2">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            Technical Evidence & Proof-of-Concept
          </span>
          <div className={`p-5 rounded-xl bg-zinc-950 border border-border font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner ${getSeverityBorder(finding.severity)}`}>
            <pre className="font-mono whitespace-pre-wrap word-break">{finding.evidence || "No raw evidence payload captured."}</pre>
          </div>
        </div>

        {/* Threat Impact & Exploitability Analysis */}
        <div className="space-y-2">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Threat Impact & Attack Vector
          </span>
          <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
            {details.impact}
          </div>
        </div>

        {/* Remediation Guidance */}
        <div className="space-y-3">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Remediation Recommendation
          </span>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs md:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans">
            {finding.remediation || details.remediation}
          </div>

          {/* Code Examples Tabs if available */}
          {details.codeExamples && details.codeExamples.length > 0 && (
            <div className={`rounded-xl border border-border overflow-hidden bg-zinc-950 ${getSeverityBorder(finding.severity)}`}>
              <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
                <Code className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold text-zinc-200 mr-2">Secure Code Implementation Reference:</span>
                {details.codeExamples.map((ex, idx) => (
                  <button
                    key={ex.lang}
                    onClick={() => setActiveCodeTab(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      activeCodeTab === idx
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {ex.lang}
                  </button>
                ))}
              </div>
              <pre className="p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                <code>{details.codeExamples[activeCodeTab]?.code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Official References */}
        {details.references && details.references.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Official Standards & Security References
            </span>
            <ul className="space-y-1.5 pl-2 font-mono text-xs">
              {details.references.map((ref, idx) => (
                <li key={idx}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1.5 underline-offset-2"
                  >
                    <span>{ref.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Back CTA */}
        <div className="pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back to Findings
          </Button>
        </div>

      </div>
    </div>
  );
}
