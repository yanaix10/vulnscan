import React from "react";
import { Shield, ShieldAlert, CheckCircle, TrendingDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function SecurityPostureGauge({ totalFindings = 0, criticalCount = 0, targetsCount = 0 }) {
  // Compute dynamic security score: 100 base, -15 per critical, -5 per high/other, clamp 0-100
  const score = Math.max(12, Math.min(98, 100 - (criticalCount * 12) - Math.min(30, totalFindings)));
  
  let grade = "A";
  let gradeColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40";
  let statusText = "Robust Security Posture";

  if (criticalCount > 3 || score < 50) {
    grade = "F";
    gradeColor = "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40";
    statusText = "Critical Vulnerability Exposure";
  } else if (criticalCount > 0 || score < 70) {
    grade = "D+";
    gradeColor = "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40";
    statusText = "Immediate Remediation Required";
  } else if (totalFindings > 5) {
    grade = "B";
    gradeColor = "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40";
    statusText = "Moderate Hardening Recommended";
  }

  // Circular gauge stroke calculations (radius 48, circumference 301.6)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
              Security Posture Score
            </span>
            <span className="text-[11px] font-mono text-muted-foreground block">
              Automated Risk Index
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${gradeColor}`}>
          Grade {grade}
        </span>
      </div>

      {/* Main Gauge Graphic */}
      <div className="flex items-center justify-around gap-4 py-3">
        {/* SVG Circular Ring Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-muted/50"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={criticalCount > 0 ? "#ef4444" : score > 75 ? "#10b981" : "#f59e0b"}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Score Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold font-mono text-foreground leading-none">
              {score}
            </span>
            <span className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
              out of 100
            </span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="space-y-2 flex-1 font-mono text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase">Posture Assessment</span>
            <div className="font-bold text-foreground text-sm font-sans">{statusText}</div>
          </div>

          <div className="space-y-1 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Attack Surface:</span>
              <span className="font-bold text-foreground">{targetsCount} targets</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Critical Flaws:</span>
              <span className={`font-bold ${criticalCount > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {criticalCount} issues
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer link to reports */}
      <Link
        to="/reports"
        className="pt-3 border-t border-border mt-2 flex items-center justify-between text-xs font-mono text-primary hover:underline group"
      >
        <span>Inspect Audit Compliance Report</span>
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </div>
  );
}
