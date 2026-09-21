import React, { useState } from "react";
import { 
  Globe, 
  Terminal, 
  Layers, 
  ExternalLink, 
  Code, 
  BookOpen,
  FileCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { groupFindingsByCheck } from "@/lib/vulnerabilityKnowledge";

export function InteractiveReport({ scan, findings = [] }) {
  const grouped = groupFindingsByCheck(findings);

  // Requirement 3: Critical and High stay fully expanded, Medium/Low/Info get accordions
  const criticalAndHigh = grouped.filter(
    (g) => g.severity === "critical" || g.severity === "high"
  );
  const mediumLowInfo = grouped.filter(
    (g) => g.severity !== "critical" && g.severity !== "high"
  );

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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Executive Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Issues</span>
          <span className="text-2xl font-bold font-mono text-primary mt-1 block">{findings.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Unique Checks</span>
          <span className="text-2xl font-bold font-mono text-foreground mt-1 block">{grouped.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-destructive/30">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Critical</span>
          <span className="text-2xl font-bold font-mono text-destructive mt-1 block">
            {grouped.filter(g => g.severity === "critical").reduce((acc, g) => acc + g.affected.length, 0)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-orange-600/30">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">High</span>
          <span className="text-2xl font-bold font-mono text-orange-500 mt-1 block">
            {grouped.filter(g => g.severity === "high").reduce((acc, g) => acc + g.affected.length, 0)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-amber-600/30">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Medium</span>
          <span className="text-2xl font-bold font-mono text-amber-500 mt-1 block">
            {grouped.filter(g => g.severity === "medium").reduce((acc, g) => acc + g.affected.length, 0)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-blue-600/30">
          <span className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Low / Info</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
            {grouped.filter(g => g.severity === "low" || g.severity === "info").reduce((acc, g) => acc + g.affected.length, 0)}
          </span>
        </div>
      </div>

      {/* CRITICAL & HIGH SEVERITY: Fully Expanded Cards */}
      {criticalAndHigh.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-destructive flex items-center gap-2">
              <span>Immediate Attention: Critical & High ({criticalAndHigh.length} checks)</span>
            </h3>
            <span className="text-xs font-mono text-muted-foreground">Always Fully Expanded</span>
          </div>

          <div className="space-y-6">
            {criticalAndHigh.map((group) => (
              <div
                key={group.check_id}
                className="p-6 md:p-8 rounded-2xl bg-card border border-border space-y-5 shadow-lg"
              >
                {/* Line 1: Severity Badge + Finding Title + CVSS right-aligned */}
                <div className="border-b border-border/80 pb-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={getSeverityBadgeVariant(group.severity)}
                        className="font-mono text-xs font-bold uppercase tracking-wider"
                      >
                        {group.severity.toUpperCase()}
                      </Badge>
                      <h4 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                        {group.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-md">
                        {group.affected.length} endpoint{group.affected.length === 1 ? "" : "s"} affected
                      </span>
                      <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/60 border border-border px-3 py-1 rounded-md">
                        {group.cvss.split(" ")[0]} CVSS
                      </span>
                    </div>
                  </div>

                  {/* Line 2: OWASP Category + CWE ID as plain text */}
                  <div className="text-sm text-muted-foreground font-sans">
                    {group.owasp_category} · {group.cwe_id.split(":")[0]}
                  </div>
                </div>

                {/* Threat Impact (No box-on-box nesting, normal padding) */}
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Threat Impact & Attack Vector
                  </h5>
                  <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                    {group.impact}
                  </p>
                </div>

                {/* Remediation (No box-on-box nesting, NO duplicate 'Remediation:' prefix) */}
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Remediation Guidance
                  </h5>
                  <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                    {group.remediation}
                  </p>
                </div>

                {/* Quoted Technical Content: Secure Code Implementation Reference */}
                {group.codeExamples && group.codeExamples.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Secure Code Implementation Reference
                    </h5>
                    <div className={`p-4 rounded-xl bg-zinc-950 border border-border font-mono text-xs text-zinc-300 overflow-x-auto ${getSeverityBorder(group.severity)}`}>
                      <div className="text-[11px] font-bold text-primary mb-2 uppercase font-mono">
                        // {group.codeExamples[0]?.lang || "Secure Patch"}
                      </div>
                      <pre className="font-mono leading-relaxed whitespace-pre-wrap">
                        <code>{group.codeExamples[0]?.code}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Quoted Technical Content: Evidence Sample */}
                {group.affected[0]?.evidence && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Proof-of-Concept Evidence Sample
                    </h5>
                    <div className={`p-4 rounded-xl bg-zinc-950 border border-border font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed ${getSeverityBorder(group.severity)}`}>
                      <pre className="font-mono">{group.affected[0].evidence}</pre>
                    </div>
                  </div>
                )}

                {/* Compact List of Every Affected Endpoint (URL + parameter, one line each) */}
                <div className="space-y-2 pt-2 border-t border-border/70">
                  <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Affected Endpoints ({group.affected.length})
                  </h5>
                  <div className="space-y-2">
                    {group.affected.map((aff, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-muted/20 border border-border/80 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                          <a
                            href={aff.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {aff.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {aff.parameter && (
                            <span className="text-amber-400 font-semibold">
                              Param: {aff.parameter}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDIUM / LOW / INFO SEVERITY: shadcn Accordion Items (type="multiple") */}
      {mediumLowInfo.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-foreground flex items-center gap-2">
              <span>Medium, Low & Info Findings ({mediumLowInfo.length} check groups · {mediumLowInfo.reduce((acc, g) => acc + g.affected.length, 0)} total endpoints)</span>
            </h3>
            <span className="text-xs font-mono text-muted-foreground">Click to Expand / Triage</span>
          </div>

          <Accordion type="multiple" className="space-y-3">
            {mediumLowInfo.map((group) => (
              <AccordionItem
                key={group.check_id}
                value={group.check_id}
                className="border border-border rounded-xl bg-card px-5 overflow-hidden shadow-sm"
              >
                {/* Collapsed Trigger Row */}
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-1 items-center justify-between pr-4 gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={getSeverityBadgeVariant(group.severity)}
                        className="font-mono text-xs font-bold uppercase tracking-wider"
                      >
                        {group.severity.toUpperCase()}
                      </Badge>
                      <span className="font-bold text-base text-foreground tracking-tight">
                        {group.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="bg-muted/80 px-2.5 py-1 rounded-md text-foreground font-semibold">
                        {group.affected.length} endpoint{group.affected.length === 1 ? "" : "s"} affected
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        {group.cvss.split(" ")[0]} CVSS
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Expanded Content (Full Detail ONCE + Compact Endpoints List) */}
                <AccordionContent className="pt-3 pb-6 space-y-5 border-t border-border/60">
                  {/* Line 2: OWASP Category + CWE ID as plain text */}
                  <div className="text-sm text-muted-foreground font-sans">
                    {group.owasp_category} · {group.cwe_id.split(":")[0]}
                  </div>

                  {/* Threat Impact (No box-on-box nesting) */}
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Threat Impact & Attack Vector
                    </h5>
                    <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                      {group.impact}
                    </p>
                  </div>

                  {/* Remediation Guidance (No box-on-box nesting, NO duplicate 'Remediation:' prefix) */}
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Remediation Guidance
                    </h5>
                    <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                      {group.remediation}
                    </p>
                  </div>

                  {/* Quoted Technical Content: Secure Code Implementation Reference */}
                  {group.codeExamples && group.codeExamples.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Secure Code Implementation Reference
                      </h5>
                      <div className={`p-4 rounded-xl bg-zinc-950 border border-border font-mono text-xs text-zinc-300 overflow-x-auto ${getSeverityBorder(group.severity)}`}>
                        <div className="text-[11px] font-bold text-primary mb-2 uppercase font-mono">
                          // {group.codeExamples[0]?.lang || "Secure Patch"}
                        </div>
                        <pre className="font-mono leading-relaxed whitespace-pre-wrap">
                          <code>{group.codeExamples[0]?.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Quoted Technical Content: Evidence Sample */}
                  {group.affected[0]?.evidence && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Technical Evidence / Sample Payload
                      </h5>
                      <div className={`p-4 rounded-xl bg-zinc-950 border border-border font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed ${getSeverityBorder(group.severity)}`}>
                        <pre className="font-mono">{group.affected[0].evidence}</pre>
                      </div>
                    </div>
                  )}

                  {/* Compact List of Every Affected Endpoint (URL + parameter, one line each) */}
                  <div className="space-y-2 pt-2 border-t border-border/70">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Affected Endpoints ({group.affected.length})
                    </h5>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {group.affected.map((aff, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/70 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                            <a
                              href={aff.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate"
                            >
                              {aff.url}
                            </a>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {aff.parameter && (
                              <span className="text-amber-400 font-semibold">
                                Param: {aff.parameter}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {grouped.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-border bg-card text-muted-foreground">
          <p className="font-mono text-sm">No security vulnerabilities detected for this target.</p>
        </div>
      )}

    </div>
  );
}
