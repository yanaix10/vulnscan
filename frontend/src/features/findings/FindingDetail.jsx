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

  const getSeverityStyle = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical":
        return {
          badge: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
          cardBorder: "border-l-4 border-l-red-500",
        };
      case "high":
        return {
          badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30",
          cardBorder: "border-l-4 border-l-orange-500",
        };
      case "medium":
        return {
          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
          cardBorder: "border-l-4 border-l-amber-500",
        };
      case "low":
        return {
          badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
          cardBorder: "border-l-4 border-l-blue-500",
        };
      default:
        return {
          badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
          cardBorder: "border-l-4 border-l-slate-400",
        };
    }
  };

  const sevStyle = getSeverityStyle(finding.severity);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Findings</span>
      </button>

      {/* Main Advisory Card - Clean Enterprise Look */}
      <div className={`p-6 sm:p-8 rounded-2xl bg-card border border-border/80 space-y-6 shadow-md ${sevStyle.cardBorder}`}>
        
        {/* Single Clean Flex Row: Severity Badge + Title + CVSS Score */}
        <div className="border-b border-border/60 pb-5 space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider shrink-0 ${sevStyle.badge}`}>
                {(finding.severity || "INFO").toUpperCase()}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-sans tracking-tight truncate">
                {details.name}
              </h1>
            </div>

            <div className="shrink-0 font-mono text-xs font-bold text-muted-foreground bg-muted/60 border border-border/70 px-3 py-1.5 rounded-lg shadow-2xs">
              {details.cvss.split(" ")[0]} CVSS
            </div>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground font-sans">
            {details.owasp} · {details.cwe.split(":")[0]}
          </div>
        </div>

        {/* Unified 3-Column Metadata Grid with Vertical Dividers */}
        <div className="rounded-xl bg-muted/30 border border-border/70 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60 overflow-hidden shadow-2xs">
          {/* Col 1: Endpoint */}
          <div className="p-4 space-y-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              ENDPOINT
            </span>
            <div className="font-mono text-xs text-foreground truncate">
              <a 
                href={finding.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline flex items-center gap-1 truncate"
                title={finding.url}
              >
                <span className="truncate">{finding.url}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
              </a>
            </div>
          </div>

          {/* Col 2: Parameter */}
          <div className="p-4 space-y-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              PARAMETER
            </span>
            <div className="font-mono text-xs font-semibold text-amber-500 dark:text-amber-400 truncate">
              {finding.parameter || "— (Host Header / URL Root)"}
            </div>
          </div>

          {/* Col 3: CWE Definition */}
          <div className="p-4 space-y-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              CWE DEFINITION
            </span>
            <div className="font-mono text-xs text-foreground truncate" title={details.cwe}>
              {details.cwe}
            </div>
          </div>
        </div>

        {/* Technical Evidence & Proof-of-Concept */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            TECHNICAL EVIDENCE & PROOF-OF-CONCEPT
          </span>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            <pre className="font-mono whitespace-pre-wrap break-all">{finding.evidence || "Response headers do not contain Content-Security-Policy."}</pre>
          </div>
        </div>

        {/* Threat Impact & Attack Vector */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            THREAT IMPACT & ATTACK VECTOR
          </span>
          <div className="p-4 rounded-xl bg-muted/40 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
            {details.impact}
          </div>
        </div>

        {/* Remediation Recommendation */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            REMEDIATION RECOMMENDATION
          </span>
          <div className="p-4 rounded-xl bg-emerald-500/10 text-xs sm:text-sm text-emerald-950 dark:text-emerald-300 leading-relaxed font-sans">
            {finding.remediation || details.remediation}
          </div>
        </div>

        {/* Secure Code Implementation Reference with Crisp Segmented Control */}
        {details.codeExamples && details.codeExamples.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-blue-500" />
                SECURE CODE IMPLEMENTATION REFERENCE
              </span>

              {/* Modern crisp segmented control */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono self-start sm:self-auto">
                {details.codeExamples.map((ex, idx) => (
                  <button
                    key={ex.lang}
                    onClick={() => setActiveCodeTab(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                      activeCodeTab === idx
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {ex.lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark code block */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-850 p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed shadow-inner">
              <code>{details.codeExamples[activeCodeTab]?.code}</code>
            </div>
          </div>
        )}

        {/* Official References */}
        {details.references && details.references.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              OFFICIAL STANDARDS & SECURITY REFERENCES
            </span>
            <ul className="space-y-1.5 font-mono text-xs pl-1">
              {details.references.map((ref, idx) => (
                <li key={idx}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline inline-flex items-center gap-1.5 underline-offset-2"
                  >
                    <span>{ref.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Back CTA */}
        <div className="pt-4 border-t border-border/60">
          <Button variant="secondary" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Findings
          </Button>
        </div>

      </div>
    </div>
  );
}

