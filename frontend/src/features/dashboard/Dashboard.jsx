import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Target as TargetIcon, 
  Activity, 
  AlertTriangle, 
  Play, 
  ChevronRight, 
  ShieldAlert, 
  Sliders, 
  Sparkles, 
  KeyRound, 
  BarChart3,
  TrendingUp,
  Radio,
  Cpu,
  Search,
  FileCheck,
  Zap,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityDot } from "@/components/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableRow, TableCell } from "../../components/Table";
import { listTargets } from "../../api/targets";
import { listScans, createScan } from "../../api/scans";
import { LiveRadarScanner } from "./widgets/LiveRadarScanner";
import { LiveSecurityEventStream } from "./widgets/LiveSecurityEventStream";
import { SecurityPostureGauge } from "./widgets/SecurityPostureGauge";

export function Dashboard() {
  const navigate = useNavigate();

  // Quick Scan Form State
  const [targetUrl, setTargetUrl] = useState("");
  const [useSpa, setUseSpa] = useState(true);
  const [maxDepth, setMaxDepth] = useState(2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authType, setAuthType] = useState("none");
  const [sessionCookie, setSessionCookie] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Dashboard Stats & Recent Scans
  const [targets, setTargets] = useState([]);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [targetsData, scansData] = await Promise.all([
          listTargets().catch(() => []),
          listScans().catch(() => []),
        ]);
        setTargets(targetsData || []);
        setScans(scansData || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadDashboardData();
  }, []);

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setScanLoading(true);
    setScanError(null);

    try {
      const payload = {
        target_url: targetUrl.trim(),
        max_depth: Number(maxDepth),
        max_pages: 15,
        use_spa: useSpa,
        rate_limit: 5.0,
      };

      if (authType === "cookie" && sessionCookie.trim()) {
        payload.session_cookie = sessionCookie.trim();
      } else if (authType === "bearer" && bearerToken.trim()) {
        payload.bearer_token = bearerToken.trim();
      }

      const newScan = await createScan(payload);
      navigate(`/scans/${newScan.id}/progress`);
    } catch (err) {
      setScanError(err.message || "Failed to initiate scan");
      setScanLoading(false);
    }
  };

  // Compute stats & severity breakdown
  const totalTargets = targets.length;
  const totalScans = scans.length;
  
  let totalOpenFindings = 0;
  let criticalFindings = 0;
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

  scans.forEach((s) => {
    if (s.findings_count) {
      totalOpenFindings += s.findings_count.total || 0;
      criticalFindings += s.findings_count.critical || 0;
      severityCounts.critical += s.findings_count.critical || 0;
      severityCounts.high += s.findings_count.high || 0;
      severityCounts.medium += s.findings_count.medium || 0;
      severityCounts.low += s.findings_count.low || 0;
      severityCounts.info += s.findings_count.info || 0;
    }
  });

  const severityColors = {
    critical: "#dc2626", // deep red
    high: "#ea580c",     // orange-red
    medium: "#d97706",   // amber
    low: "#3b82f6",      // cool blue
    info: "#64748b",     // muted gray
  };

  const chartData = [
    { name: "Critical", value: severityCounts.critical, color: severityColors.critical },
    { name: "High", value: severityCounts.high, color: severityColors.high },
    { name: "Medium", value: severityCounts.medium, color: severityColors.medium },
    { name: "Low", value: severityCounts.low, color: severityColors.low },
    { name: "Info", value: severityCounts.info, color: severityColors.info },
  ].filter((d) => d.value > 0);

  return (
    <div className="relative min-h-full pb-16 bg-background">
      {/* Content wrapper with clean, professional styling */}
      <div className="relative z-10 space-y-8 px-6 md:px-8 py-6 max-w-7xl mx-auto">
        
        {/* HERO SECTION: Command Center */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-xs cyber-grid-bg">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono tracking-wider uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              OWASP Top 10 Automated DAST
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight font-sans">
              Defend. Audit. <span className="text-primary font-bold">Discover.</span>
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Launch modular deep-crawling vulnerability scans across authorized hosts. Inspect SQLi, XSS, CSRF, broken access control, and misconfigurations with immediate real-time reporting.
            </p>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleQuickScan} className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://target-app.example.com or http://localhost:3001"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-background border border-input focus:border-primary text-foreground placeholder-muted-foreground font-mono text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                variant="default"
                loading={scanLoading}
                className="px-8 text-sm font-semibold tracking-wide shrink-0 h-auto py-3.5 shadow-xs"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Scan
              </Button>
            </div>

            {/* Quick configuration toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer hover:text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={useSpa}
                    onChange={(e) => setUseSpa(e.target.checked)}
                    className="rounded border-border bg-background text-primary focus:ring-primary"
                  />
                  <span>SPA Mode (Playwright Headless)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span>Depth:</span>
                  <Select
                    value={String(maxDepth)}
                    onValueChange={(val) => setMaxDepth(Number(val))}
                  >
                    <SelectTrigger className="w-[125px] h-7 text-xs bg-background border-input text-foreground">
                      <SelectValue placeholder="Select depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Surface)</SelectItem>
                      <SelectItem value="2">2 (Standard)</SelectItem>
                      <SelectItem value="3">3 (Deep)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-primary hover:underline transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvanced ? "Hide Auth Settings" : "+ Authentication Options"}</span>
              </button>
            </div>

            {/* Advanced Auth Dropdown Panel */}
            {showAdvanced && (
              <div className="p-4 rounded-xl bg-card border border-border space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Auth Type:
                  </span>
                  {["none", "cookie", "bearer"].map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="authType"
                        value={type}
                        checked={authType === type}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="text-primary bg-background border-border focus:ring-primary"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>

                {authType === "cookie" && (
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Session Cookie (e.g. session_id=abc123xyz; token=eyJ...)
                    </label>
                    <input
                      type="text"
                      placeholder="session=example_token_value"
                      value={sessionCookie}
                      onChange={(e) => setSessionCookie(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {authType === "bearer" && (
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Bearer / API Token (without "Bearer " prefix)
                    </label>
                    <input
                      type="text"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            )}

            {scanError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono">
                Error: {scanError}
              </div>
            )}

            {/* Visual Scan Pipeline Steps */}
            <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                Execution Pipeline:
              </span>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-beacon" />
                  1. Discovery
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="flex items-center gap-1 text-primary font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  2. Playwright Crawl
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="flex items-center gap-1 text-muted-foreground px-2 py-0.5 rounded bg-muted/40 border border-border">
                  3. Heuristic Fuzz
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="flex items-center gap-1 text-muted-foreground px-2 py-0.5 rounded bg-muted/40 border border-border">
                  4. Compliance Report
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                12 Engines Active
              </span>
            </div>
          </form>
        </div>

        {/* METRICS & SEVERITY CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 4 Animated Stat Cards in 2x2 grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Targets */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-foreground font-mono">{totalTargets}</span>
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <TargetIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                Targets Registered
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/60">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3 h-3" /> Host Surface
                </span>
                <span>Active Scope</span>
              </div>
            </div>

            {/* Card 2: Scans Run */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-foreground font-mono">{totalScans}</span>
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                Scans Executed
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/60">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Zap className="w-3 h-3" /> 100% Synced
                </span>
                <span>Telemetry Live</span>
              </div>
            </div>

            {/* Card 3: Open Findings */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{totalOpenFindings}</span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                Total Findings
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/60">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  Across 8 Checks
                </span>
                <span>DAST Audit</span>
              </div>
            </div>

            {/* Card 4: Critical Findings */}
            <div className="rounded-2xl border border-red-200 dark:border-destructive/30 bg-card p-5 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-destructive font-mono">{criticalFindings}</span>
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                Critical Severity
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/60">
                <span className="flex items-center gap-1 text-destructive font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> Urgent Attention
                </span>
                <span>Immediate Patch</span>
              </div>
            </div>
          </div>

          {/* Severity Distribution Donut Chart Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary" />
                Severity Breakdown
              </span>
              <span className="text-xs font-mono text-muted-foreground font-semibold">
                {totalOpenFindings} total
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="flex items-center justify-between gap-2 py-2">
                <div className="w-36 h-36 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-popover border border-border px-2.5 py-1.5 rounded-md shadow-md text-xs font-mono text-popover-foreground">
                                <span className="font-bold">{data.name}:</span> {data.value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={36}
                        outerRadius={56}
                        stroke="none"
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center total */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold font-mono text-foreground leading-none">{totalOpenFindings}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono font-medium">Issues</span>
                  </div>
                </div>

                {/* Legend list with exact numbers */}
                <div className="flex-1 space-y-1.5 pl-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors.critical }} />
                      <span>Crit</span>
                    </span>
                    <span className="font-bold text-foreground">{severityCounts.critical}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors.high }} />
                      <span>High</span>
                    </span>
                    <span className="font-bold text-foreground">{severityCounts.high}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors.medium }} />
                      <span>Med</span>
                    </span>
                    <span className="font-bold text-foreground">{severityCounts.medium}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors.low }} />
                      <span>Low</span>
                    </span>
                    <span className="font-bold text-foreground">{severityCounts.low}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground">
                No findings recorded yet. Run a scan to populate telemetry.
              </div>
            )}
          </div>
        </div>

        {/* DYNAMIC SOC ANIMATION WIDGETS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <LiveRadarScanner targetsCount={totalTargets} scansCount={totalScans} />
          <LiveSecurityEventStream />
          <SecurityPostureGauge 
            totalFindings={totalOpenFindings} 
            criticalCount={criticalFindings} 
            targetsCount={totalTargets} 
          />
        </div>

        {/* RECENT SCANS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Scans
            </h3>
            <Link to="/scans" className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
              View All History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Table
            headers={["Target", "Status", "Findings", "Duration", "Actions"]}
            emptyMessage="No scans recorded yet. Enter a URL above to start your first scan."
          >
            {scans.slice(0, 5).map((scan) => {
              let highestSev = "clean";
              if (scan.findings_count) {
                if (scan.findings_count.critical > 0) highestSev = "critical";
                else if (scan.findings_count.high > 0) highestSev = "high";
                else if (scan.findings_count.medium > 0) highestSev = "medium";
                else if (scan.findings_count.low > 0) highestSev = "low";
                else if (scan.findings_count.info > 0) highestSev = "info";
              }

              const isRunning = scan.status === "running" || scan.status === "queued";

              return (
                <TableRow key={scan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <SeverityDot severity={highestSev} />
                      <div>
                        <div className="font-mono text-sm font-medium text-foreground hover:text-primary transition-colors">
                          {scan.target_url || `Target #${scan.target_id}`}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {new Date(scan.started_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        scan.status === "failed"
                          ? "destructive"
                          : scan.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                      className="uppercase font-mono text-[10px]"
                    >
                      {scan.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {scan.findings_count?.total || 0} findings
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {scan.pages_crawled} pages
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isRunning ? (
                        <Link to={`/scans/${scan.id}/progress`}>
                          <Button size="sm" variant="outline">
                            Live Progress
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/scans/${scan.id}/findings`}>
                          <Button size="sm" variant="secondary">
                            View Findings
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </div>

      </div>
    </div>
  );
}
