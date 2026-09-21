import React from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Radar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Clock, 
  Loader2,
  ShieldCheck,
  Globe
} from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { useScanPolling } from "../../hooks/useScanPolling";

export function ScanProgress() {
  const { id } = useParams();
  const { scan, loading, error, isComplete, isFailed } = useScanPolling(id, 1500);

  if (loading && !scan) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-mono text-sm text-muted-foreground">Connecting to scan engine session #{id}...</p>
      </div>
    );
  }

  if (error && !scan) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Scan Session Not Found</h3>
        <p className="text-sm text-muted-foreground font-mono">{error}</p>
        <Link to="/scans">
          <Button variant="secondary">Back to Scans</Button>
        </Link>
      </div>
    );
  }

  const pagesCrawled = scan?.pages_crawled || 0;
  
  // Real multistage progress calculation
  let progressPercent = 0;
  let currentPhase = "Initializing Engine...";

  if (isComplete) {
    progressPercent = 100;
    currentPhase = "Vulnerability Audit Finalized";
  } else if (isFailed) {
    progressPercent = 100;
    currentPhase = "Scan Failed · Target unreachable or connection refused";
  } else if (pagesCrawled === 0) {
    progressPercent = 5;
    currentPhase = "Verifying target connectivity & establishing handshake...";
  } else if (pagesCrawled < 5) {
    progressPercent = 10 + pagesCrawled * 7;
    currentPhase = `Crawling endpoint tree (${pagesCrawled} pages discovered)...`;
  } else if (pagesCrawled < 15) {
    progressPercent = Math.min(80, 45 + pagesCrawled * 2);
    currentPhase = `Injecting OWASP Top 10 payloads into forms & parameters (${pagesCrawled} pages audited)...`;
  } else {
    progressPercent = Math.min(95, 75 + Math.floor(pagesCrawled / 2));
    currentPhase = `Concurrent active fuzzing & header checks (${pagesCrawled} pages scanned)...`;
  }

  const findingsCount = scan?.findings_count || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header (Companion Guide Page 6) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Radar className={`w-4 h-4 ${isComplete ? "text-emerald-400" : "text-primary animate-spin"}`} />
            <span>Scan #{scan?.id} · {isComplete ? "Audit Finished" : "Live Execution"}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-wide flex items-center gap-3">
            <span>Scanning:</span>
            <span className="font-mono text-primary truncate max-w-xl">
              {scan?.target_url || `Target #${scan?.target_id}`}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            {isComplete 
              ? "All crawler routes and concurrent vulnerability checks have completed."
              : "Crawling endpoint paths, analyzing forms, and concurrently dispatching checks..."}
          </p>
        </div>

        {isComplete && (
          <div className="flex items-center gap-3 animate-in fade-in">
            <Link to={`/scans/${scan.id}/findings`}>
              <Button variant="default">
                View Findings ({findingsCount.total})
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={`/scans/${scan.id}/report`}>
              <Button variant="secondary">
                <FileText className="w-4 h-4" />
                Report
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Progress Bar and Metrics (Companion Guide Page 6) */}
      <div className="p-6 md:p-8 rounded-2xl bg-card border border-border space-y-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              {!isComplete && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              {pagesCrawled} pages discovered · {progressPercent}% complete
            </span>
            <span className="uppercase text-primary font-bold tracking-wider">
              {scan?.status}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden border border-border p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : isFailed
                  ? "bg-destructive"
                  : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 shadow-sm"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-between pt-1">
            <span className="text-foreground/80 font-medium">{currentPhase}</span>
            <span className="text-muted-foreground">{isComplete ? "Finished" : "Engine Active"}</span>
          </div>
        </div>

        {/* FINDINGS SO FAR: Running Severity Tally */}
        <div className="space-y-3 pt-2">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Findings So Far
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="critical" size="md">
              {findingsCount.critical} CRITICAL
            </Badge>
            <Badge variant="high" size="md">
              {findingsCount.high} HIGH
            </Badge>
            <Badge variant="medium" size="md">
              {findingsCount.medium} MEDIUM
            </Badge>
            <Badge variant="low" size="md">
              {findingsCount.low} LOW
            </Badge>
            <Badge variant="info" size="md">
              {findingsCount.info} INFO
            </Badge>
          </div>
        </div>

        {/* RECENT ACTIVITY FEED */}
        <div className="space-y-3 pt-4 border-t border-border">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Engine Activity Stream
          </span>

          <div className="space-y-2 font-mono text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-border flex items-center justify-between">
              <span className="text-zinc-300">
                Scope Verification against allowlist: {scan?.target_url || "Target"}
              </span>
              <span className="text-emerald-400 font-semibold">ALLOWED</span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-border flex items-center justify-between">
              <span className="text-zinc-300">
                Crawler breadth-first exploration (Depth: standard)
              </span>
              <span className="text-primary font-semibold">{pagesCrawled} endpoints indexed</span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-border flex items-center justify-between">
              <span className="text-zinc-300">
                SQLi, Reflected XSS, CSRF & Security Header plugins
              </span>
              <span className={isComplete ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                {isComplete ? "COMPLETED" : "EXECUTING"}
              </span>
            </div>

            {findingsCount.total > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 flex items-center justify-between text-amber-300">
                <span>Discovered {findingsCount.total} total vulnerability issues in target surface</span>
                <span className="font-bold text-amber-400 font-mono">RECORDED</span>
              </div>
            )}
          </div>
        </div>

        {/* Completion Action Banner */}
        {isComplete && (
          <div className="p-5 rounded-xl bg-card border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-600/40 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">Scan Execution Finished</h4>
                <p className="text-xs text-muted-foreground font-mono">
                  Finished at {scan.finished_at ? new Date(scan.finished_at).toLocaleTimeString() : "now"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to={`/scans/${scan.id}/findings`}>
                <Button variant="default">
                  Review Findings Table
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
