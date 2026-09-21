import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_EVENTS = [
  { id: 1, time: "14:55:02", type: "vuln", check: "SQL Injection", target: "/index.php?id=1", sev: "critical", msg: "Boolean SQL syntax anomaly verified" },
  { id: 2, time: "14:55:05", type: "vuln", check: "Reflected XSS", target: "/search.php?q=", sev: "high", msg: "Unescaped DOM payload reflected" },
  { id: 3, time: "14:55:08", type: "crawl", check: "Crawler", target: "/api/v1/auth", sev: "info", msg: "Discovered 4 new form parameters" },
  { id: 4, time: "14:55:12", type: "vuln", check: "Missing CSP", target: "/dashboard.php", sev: "low", msg: "Content-Security-Policy header absent" },
  { id: 5, time: "14:55:15", type: "vuln", check: "CSRF Defense", target: "/settings.php", sev: "medium", msg: "State change missing Anti-CSRF token" },
  { id: 6, time: "14:55:18", type: "safe", check: "Path Traversal", target: "/download.php", sev: "safe", msg: "Canonical path verification passed" },
  { id: 7, time: "14:55:22", type: "vuln", check: "Outdated Dep", target: "/js/jquery.min.js", sev: "low", msg: "jQuery v1.12.4 vulnerable to CVE-2020-11022" },
];

export function LiveSecurityEventStream() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [filter, setFilter] = useState("all"); // "all", "vuln", "safe"

  // Subtle live simulated event push every 6 seconds to show active system
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const newEvent = {
        id: Date.now(),
        time: timeStr,
        type: Math.random() > 0.4 ? "vuln" : "crawl",
        check: ["Security Headers", "Reflected XSS", "CSRF Check", "SQL Injection", "Dependency Audit"][Math.floor(Math.random() * 5)],
        target: ["/api/v1/user", "/checkout.php", "/profile.php", "/feedback.php"][Math.floor(Math.random() * 4)],
        sev: ["critical", "high", "medium", "low", "info"][Math.floor(Math.random() * 5)],
        msg: "Automated telemetry signal verified."
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 8)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const filtered = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "vuln") return e.type === "vuln";
    if (filter === "safe") return e.type === "safe" || e.type === "crawl";
    return true;
  });

  const getSevBadge = (sev) => {
    switch (sev) {
      case "critical":
        return <Badge variant="destructive" className="font-mono text-[10px] uppercase">Crit</Badge>;
      case "high":
        return <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40">High</span>;
      case "medium":
        return <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">Med</span>;
      case "low":
        return <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40">Low</span>;
      default:
        return <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">Info</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
              Live Threat Stream
            </span>
            <span className="text-[11px] font-mono text-muted-foreground block">
              Continuous Audit Event Log
            </span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border text-[10px] font-mono">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              filter === "all" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("vuln")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              filter === "vuln" ? "bg-card text-destructive shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Threats
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/70 transition-all flex items-center justify-between gap-3 text-xs font-mono animate-stream-item"
          >
            <div className="flex items-center gap-2.5 truncate">
              {item.type === "vuln" ? (
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}

              <div className="truncate">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-foreground truncate">{item.check}</span>
                  <span className="text-muted-foreground truncate hidden sm:inline">{item.target}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{item.msg}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getSevBadge(item.sev)}
              <span className="text-[10px] text-muted-foreground">{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer live status */}
      <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-beacon" />
          <span>Real-time heuristic analyzer active</span>
        </span>
        <span className="text-primary font-semibold">{filtered.length} captured</span>
      </div>
    </div>
  );
}
