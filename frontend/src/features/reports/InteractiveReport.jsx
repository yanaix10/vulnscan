import React, { useState } from "react";
import { 
  Globe, 
  ExternalLink, 
  Code, 
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { groupFindingsByCheck } from "@/lib/vulnerabilityKnowledge";

export function InteractiveReport({ scan, findings = [] }) {
  const grouped = groupFindingsByCheck(findings);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [expandedChecks, setExpandedChecks] = useState(() => {
    // By default, expand all findings that are Critical/High, or expand the first item if only low/medium
    const initial = {};
    grouped.forEach((g, idx) => {
      if (g.severity === "critical" || g.severity === "high" || idx === 0) {
        initial[g.check_id] = true;
      }
    });
    return initial;
  });
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const toggleExpand = (checkId) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Severity counts
  const criticalCount = grouped.filter(g => g.severity === "critical").reduce((acc, g) => acc + g.affected.length, 0);
  const highCount = grouped.filter(g => g.severity === "high").reduce((acc, g) => acc + g.affected.length, 0);
  const mediumCount = grouped.filter(g => g.severity === "medium").reduce((acc, g) => acc + g.affected.length, 0);
  const lowCount = grouped.filter(g => g.severity === "low").reduce((acc, g) => acc + g.affected.length, 0);
  const infoCount = grouped.filter(g => g.severity === "info").reduce((acc, g) => acc + g.affected.length, 0);
  const totalIssues = findings.length;

  // Filtered findings
  const filtered = grouped.filter(group => {
    const matchesSeverity = selectedSeverity === "all" || group.severity === selectedSeverity;
    const matchesQuery = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.cwe_id && group.cwe_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (group.owasp_category && group.owasp_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      group.affected.some(a => a.url.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesQuery;
  });

  const getSeverityStyle = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical":
        return {
          badge: "bg-red-500/15 text-red-600 border-red-500/30 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800",
          dot: "bg-red-500",
          cardBorder: "border-l-4 border-l-red-500 border-border hover:border-red-500/40",
          glow: "shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]"
        };
      case "high":
        return {
          badge: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800",
          dot: "bg-orange-500",
          cardBorder: "border-l-4 border-l-orange-500 border-border hover:border-orange-500/40",
          glow: "shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)]"
        };
      case "medium":
        return {
          badge: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
          dot: "bg-amber-500",
          cardBorder: "border-l-4 border-l-amber-500 border-border hover:border-amber-500/40",
          glow: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]"
        };
      case "low":
        return {
          badge: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800",
          dot: "bg-blue-500",
          cardBorder: "border-l-4 border-l-blue-500 border-border hover:border-blue-500/40",
          glow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]"
        };
      default:
        return {
          badge: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
          dot: "bg-slate-500",
          cardBorder: "border-l-4 border-l-slate-400 border-border",
          glow: ""
        };
    }
  };

  const filterTabs = [
    { 
      id: "all", 
      label: "All", 
      count: totalIssues,
      activeClass: "bg-primary text-primary-foreground font-semibold shadow-xs",
      badgeActive: "bg-primary-foreground/20 text-primary-foreground",
      badgeInactive: "bg-muted text-muted-foreground",
      hoverClass: "text-muted-foreground hover:text-foreground hover:bg-muted"
    },
    { 
      id: "critical", 
      label: "Critical", 
      count: criticalCount,
      activeClass: "bg-red-600 text-white font-semibold shadow-xs",
      badgeActive: "bg-white/25 text-white",
      badgeInactive: "bg-red-500/15 text-red-600 dark:text-red-400",
      hoverClass: "text-muted-foreground hover:text-red-600 hover:bg-red-500/10",
      dot: "bg-red-500"
    },
    { 
      id: "high", 
      label: "High", 
      count: highCount,
      activeClass: "bg-orange-600 text-white font-semibold shadow-xs",
      badgeActive: "bg-white/25 text-white",
      badgeInactive: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      hoverClass: "text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10",
      dot: "bg-orange-500"
    },
    { 
      id: "medium", 
      label: "Medium", 
      count: mediumCount,
      activeClass: "bg-amber-500 text-white font-semibold shadow-xs",
      badgeActive: "bg-white/25 text-white",
      badgeInactive: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      hoverClass: "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10",
      dot: "bg-amber-500"
    },
    { 
      id: "low", 
      label: "Low", 
      count: lowCount,
      activeClass: "bg-blue-600 text-white font-semibold shadow-xs",
      badgeActive: "bg-white/25 text-white",
      badgeInactive: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      hoverClass: "text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10",
      dot: "bg-blue-500"
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Executive Security Health Card */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Posture Overview */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            criticalCount > 0 || highCount > 0
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50"
              : mediumCount > 0
                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50"
                : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50"
          }`}>
            {criticalCount > 0 || highCount > 0 ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground font-sans">
                {criticalCount > 0
                  ? "Critical Vulnerabilities Detected"
                  : highCount > 0
                    ? "High Severity Risks Found"
                    : mediumCount > 0
                      ? "Moderate Security Advisory"
                      : lowCount > 0
                        ? "Low Risk · Minor Hardening Needed"
                        : "Security Posture Verified"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audited across 10 OWASP DAST engines · {grouped.length} unique check groups evaluated
            </p>
          </div>
        </div>

        {/* Severity Metrics Bar with Distinct Vibrant Colors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            criticalCount > 0 
              ? "bg-red-500/15 text-red-600 border-red-500/40 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800 font-semibold shadow-xs" 
              : "bg-red-500/5 text-red-600/70 border-red-500/20 dark:bg-red-950/20 dark:text-red-400/70 dark:border-red-900/30"
          }`}>
            <span className={`w-2 h-2 rounded-full bg-red-500 ${criticalCount > 0 ? "animate-pulse" : "opacity-80"}`} />
            <span>Critical: <strong>{criticalCount}</strong></span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            highCount > 0 
              ? "bg-orange-500/15 text-orange-600 border-orange-500/40 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800 font-semibold shadow-xs" 
              : "bg-orange-500/5 text-orange-600/70 border-orange-500/20 dark:bg-orange-950/20 dark:text-orange-400/70 dark:border-orange-900/30"
          }`}>
            <span className={`w-2 h-2 rounded-full bg-orange-500 ${highCount > 0 ? "" : "opacity-80"}`} />
            <span>High: <strong>{highCount}</strong></span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            mediumCount > 0 
              ? "bg-amber-500/15 text-amber-600 border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 font-semibold shadow-xs" 
              : "bg-amber-500/5 text-amber-600/70 border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400/70 dark:border-amber-900/30"
          }`}>
            <span className={`w-2 h-2 rounded-full bg-amber-500 ${mediumCount > 0 ? "" : "opacity-80"}`} />
            <span>Med: <strong>{mediumCount}</strong></span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            lowCount > 0 
              ? "bg-blue-500/15 text-blue-600 border-blue-500/40 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800 font-semibold shadow-xs" 
              : "bg-blue-500/5 text-blue-600/70 border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400/70 dark:border-blue-900/30"
          }`}>
            <span className={`w-2 h-2 rounded-full bg-blue-500 ${lowCount > 0 ? "" : "opacity-80"}`} />
            <span>Low: <strong>{lowCount}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono font-medium text-foreground shadow-2xs">
            <span>Total: <strong>{totalIssues}</strong></span>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar - Pixel-Perfect Aligned */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Severity Filter Tabs */}
        <div className="h-10 flex items-center gap-1 p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto">
          {filterTabs.map(tab => {
            const isSelected = selectedSeverity === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSeverity(tab.id)}
                className={`h-8 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 select-none shrink-0 ${
                  isSelected ? tab.activeClass : tab.hoverClass
                }`}
              >
                {tab.dot && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : tab.dot}`} />
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected ? tab.badgeActive : tab.badgeInactive
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input with matching h-10 height and border styling */}
        <div className="relative w-full sm:w-80 h-10 flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, CWE, or URL..."
            className="w-full h-10 pl-9 pr-8 text-xs rounded-xl bg-card border border-border ops-search-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <span className="text-xs font-bold">×</span>
            </button>
          )}
        </div>
      </div>


      {/* Findings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground">No matching findings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {grouped.length === 0 
                ? "Clean scan! No vulnerabilities detected on this target." 
                : "No findings match the current filter or search criteria."}
            </p>
          </div>
        ) : (
          filtered.map(group => {
            const isExpanded = !!expandedChecks[group.check_id];
            const style = getSeverityStyle(group.severity);

            return (
              <div 
                key={group.check_id}
                className={`rounded-2xl bg-card border transition-all duration-200 shadow-xs overflow-hidden ${style.cardBorder}`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(group.check_id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border shrink-0 ${style.badge}`}>
                      {group.severity}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-foreground font-sans tracking-tight truncate">
                        {group.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {group.owasp_category && (
                          <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded">
                            {group.owasp_category}
                          </span>
                        )}
                        {group.cwe_id && (
                          <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded">
                            {group.cwe_id.split(":")[0]}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {group.cvss.split(" ")[0]} CVSS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                      {group.affected.length} endpoint{group.affected.length === 1 ? "" : "s"}
                    </span>
                    <button className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 pt-0 space-y-5 border-t border-border/60 mt-1">
                    
                    {/* Impact & Attack Vector */}
                    <div className="pt-4 space-y-1.5">
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Threat Impact & Attack Vector</span>
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed font-sans pl-5">
                        {group.impact}
                      </p>
                    </div>

                    {/* Remediation Guidance */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Recommended Remediation</span>
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed font-sans pl-5">
                        {group.remediation}
                      </p>
                    </div>

                    {/* Implementation Code Reference */}
                    {group.codeExamples && group.codeExamples.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5 text-primary" />
                            <span>Secure Configuration / Patch Reference</span>
                          </h4>
                          <button
                            onClick={() => handleCopyCode(group.codeExamples[0]?.code, group.check_id)}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
                          >
                            {copiedCodeId === group.check_id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 overflow-x-auto text-xs font-mono text-zinc-300">
                          <div className="text-[10px] text-primary/80 font-bold mb-1.5 uppercase">
                            // {group.codeExamples[0]?.lang || "Configuration Snippet"}
                          </div>
                          <pre className="leading-relaxed whitespace-pre-wrap">
                            <code>{group.codeExamples[0]?.code}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Affected Endpoints List */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span>Affected Endpoints ({group.affected.length})</span>
                      </h4>
                      
                      <div className="space-y-1.5">
                        {group.affected.map((aff, i) => (
                          <div 
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/60 text-xs font-mono"
                          >
                            <a 
                              href={aff.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate flex items-center gap-1.5"
                            >
                              <span>{aff.url}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                            </a>

                            {aff.parameter && (
                              <span className="text-amber-500 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                                Param: {aff.parameter}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default InteractiveReport;
