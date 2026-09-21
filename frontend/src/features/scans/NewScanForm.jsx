import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Play, 
  Layers, 
  KeyRound, 
  Cpu, 
  Compass, 
  Gauge, 
  CheckSquare, 
  ShieldAlert,
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTargets } from "../../api/targets";
import { createScan } from "../../api/scans";

export function NewScanForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTargetId = searchParams.get("target_id");

  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(preselectedTargetId || "");
  const [customUrl, setCustomUrl] = useState("");
  const [profile, setProfile] = useState("full");
  const [techStack, setTechStack] = useState("auto");
  const [authType, setAuthType] = useState("none");
  const [maxDepth, setMaxDepth] = useState(3);
  const [rateLimit, setRateLimit] = useState(5.0);
  const [useSpa, setUseSpa] = useState(false);

  // Auth credential fields
  const [sessionCookie, setSessionCookie] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Custom checks selection (if profile == 'custom')
  const [selectedChecks, setSelectedChecks] = useState([
    "sqli", "xss", "csrf", "open_redirect", "sensitive_files", "security_headers", "insecure_cookies"
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTargets() {
      try {
        const data = await listTargets();
        setTargets(data || []);
        if (!selectedTargetId && data?.length > 0) {
          setSelectedTargetId(String(data[0].id));
        }
      } catch (err) {
        console.error("Error fetching targets", err);
      }
    }
    fetchTargets();
  }, []);

  const handleCheckToggle = (checkId) => {
    setSelectedChecks((prev) => 
      prev.includes(checkId) ? prev.filter((c) => c !== checkId) : [...prev, checkId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        max_depth: Number(maxDepth),
        max_pages: profile === "quick" ? 10 : 30,
        rate_limit: Number(rateLimit),
        use_spa: useSpa,
      };

      if (customUrl.trim()) {
        payload.target_url = customUrl.trim();
      } else if (selectedTargetId && selectedTargetId !== "custom") {
        payload.target_id = Number(selectedTargetId);
      } else {
        throw new Error("Please enter a valid target URL (e.g. http://localhost)");
      }

      // Add auth
      if (authType === "cookie" && sessionCookie.trim()) {
        payload.session_cookie = sessionCookie.trim();
      } else if (authType === "bearer" && bearerToken.trim()) {
        payload.bearer_token = bearerToken.trim();
      } else if (authType === "login_form") {
        payload.login_url = loginUrl.trim();
        payload.username = username.trim();
        payload.password = password.trim();
      }

      const scanResult = await createScan(payload);
      navigate(`/scans/${scanResult.id}/progress`);
    } catch (err) {
      setError(err.message || "Failed to start scan");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-wide">
            New Security Scan
          </h2>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">
            Configure scan parameters, crawling constraints, and authentication credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-card border border-border space-y-6 shadow-xl">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs font-mono">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Target Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Target URL
              </span>
              {targets.length > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono font-normal">
                  or pick saved below
                </span>
              )}
            </label>

            {/* Always visible target URL input box */}
            <input
              type="text"
              required
              placeholder="e.g. http://localhost or https://example.com"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setSelectedTargetId("custom");
              }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground"
            />

            {/* Optional dropdown to autofill from saved targets */}
            {targets.length > 0 && (
              <div className="mt-2">
                <Select
                  value={selectedTargetId || "custom"}
                  onValueChange={(val) => {
                    setSelectedTargetId(val);
                    if (val !== "custom") {
                      const found = targets.find((t) => String(t.id) === val);
                      if (found) setCustomUrl(found.base_url);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-card border-border text-foreground font-mono text-xs">
                    <SelectValue placeholder="-- Or autofill from registered targets --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">-- Or autofill from registered targets --</SelectItem>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.base_url} {t.notes ? `(${t.notes})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 2. Scan Profile */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Scan Profile
            </label>
            <Select value={profile} onValueChange={setProfile}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-foreground font-mono text-sm">
                <SelectValue placeholder="Select scan profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Scan (All active OWASP checks)</SelectItem>
                <SelectItem value="quick">Quick Scan (Headers, Cookies, Sensitive files - fast)</SelectItem>
                <SelectItem value="custom">Custom Profile (Manual check selection)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Target Tech Stack */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Target Tech Stack
            </label>
            <Select value={techStack} onValueChange={setTechStack}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-foreground font-mono text-sm">
                <SelectValue placeholder="Select tech stack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                <SelectItem value="nodejs">Node.js / Express</SelectItem>
                <SelectItem value="python">Python / Django / FastAPI</SelectItem>
                <SelectItem value="php">PHP / Laravel</SelectItem>
                <SelectItem value="java">Java / Spring</SelectItem>
                <SelectItem value="ruby">Ruby on Rails</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="generic">Generic Web App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Authentication */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Authentication
            </label>
            <Select value={authType} onValueChange={setAuthType}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-foreground font-mono text-sm">
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Public surface)</SelectItem>
                <SelectItem value="cookie">Session Cookie</SelectItem>
                <SelectItem value="bearer">Bearer Token (JWT / API key)</SelectItem>
                <SelectItem value="login_form">Automated Login Form</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Max Crawl Depth */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              Max Crawl Depth
            </label>
            <Select value={String(maxDepth)} onValueChange={(val) => setMaxDepth(Number(val))}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-foreground font-mono text-sm">
                <SelectValue placeholder="Select crawl depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 level (Homepage only)</SelectItem>
                <SelectItem value="2">2 levels (Standard crawl)</SelectItem>
                <SelectItem value="3">3 levels (Deep link traversal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 6. Rate Limit */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Rate Limit
            </label>
            <Select value={String(rateLimit)} onValueChange={(val) => setRateLimit(Number(val))}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-foreground font-mono text-sm">
                <SelectValue placeholder="Select rate limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Gentle (2 req/s)</SelectItem>
                <SelectItem value="5">Considerate (5 req/s - Recommended)</SelectItem>
                <SelectItem value="10">Aggressive (10 req/s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Auth Fields */}
        {authType === "cookie" && (
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-muted-foreground font-semibold">
                Cookie String
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Format: PHPSESSID=...; security=low
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="PHPSESSID=nsnjha2ourih45j5r5rmor5ib6; security=low"
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:border-primary"
            />
            {/* Quick DVWA security level toggles */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-muted-foreground">DVWA Preset:</span>
              {["low", "medium", "high", "impossible"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    let updated = sessionCookie || "PHPSESSID=nsnjha2ourih45j5r5rmor5ib6; security=" + lvl;
                    if (updated.includes("security=")) {
                      updated = updated.replace(/security=[a-z]+/i, `security=${lvl}`);
                    } else {
                      updated = updated.trim().replace(/;?$/, `; security=${lvl}`);
                    }
                    setSessionCookie(updated);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    sessionCookie.includes(`security=${lvl}`)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>
                DVWA determines its security level from the <code className="text-foreground bg-muted px-1 py-0.5 rounded">security=...</code> cookie sent in the HTTP request.
              </span>
            </p>
          </div>
        )}

        {authType === "bearer" && (
          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <label className="block text-xs font-mono text-muted-foreground font-semibold">
              Bearer Token
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {authType === "login_form" && (
          <div className="p-4 rounded-xl bg-card border border-border grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground font-semibold mb-1">
                Login URL
              </label>
              <input
                type="url"
                required
                placeholder="https://app.example.com/login"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground font-semibold mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="admin@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Dynamic Custom Checks Checklist */}
        {profile === "custom" && (
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Select Checks to Run:
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              {[
                { id: "sqli", label: "SQL Injection (A03)" },
                { id: "xss", label: "Reflected XSS (A03)" },
                { id: "csrf", label: "Missing CSRF Token (A01)" },
                { id: "open_redirect", label: "Open Redirect (A01)" },
                { id: "sensitive_files", label: "Sensitive File Exposure (A01/A05)" },
                { id: "security_headers", label: "Security Headers (A05)" },
                { id: "insecure_cookies", label: "Insecure Cookies (A05)" },
              ].map((chk) => (
                <label key={chk.id} className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedChecks.includes(chk.id)}
                    onChange={() => handleCheckToggle(chk.id)}
                    className="rounded bg-background border-border text-primary focus:ring-primary"
                  />
                  <span>{chk.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* SPA Crawl Checkbox */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={useSpa}
              onChange={(e) => setUseSpa(e.target.checked)}
              className="rounded bg-background border-border text-primary focus:ring-primary w-4 h-4"
            />
            <span>Enable SPA Headless Browser (Essential for Angular/React/Vue apps)</span>
          </label>

          <Button type="submit" variant="default" size="lg" loading={loading} className="px-8">
            <Play className="w-5 h-5 fill-current" />
            Start Scan
          </Button>
        </div>
      </form>
    </div>
  );
}
