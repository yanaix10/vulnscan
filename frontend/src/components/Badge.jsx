import React from "react";

export function Badge({ 
  children, 
  variant = "info", 
  size = "md",
  className = "" 
}) {
  const norm = (variant || "").toLowerCase();

  const variantStyles = {
    // Severity colors
    critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-400 dark:border-red-600/60",
    high: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-400 dark:border-orange-600/60",
    medium: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/50",
    low: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-600/40",
    info: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/90 dark:text-slate-300 dark:border-slate-700/60",
    
    // Status colors
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-600/40",
    running: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-400 dark:border-indigo-600/50 animate-pulse",
    queued: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-950/80 dark:text-yellow-400 dark:border-yellow-600/40",
    failed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-500 dark:border-red-700",
  };

  const style = variantStyles[norm] || variantStyles.info;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider",
    md: "px-2.5 py-1 text-xs font-semibold tracking-wider",
    lg: "px-3 py-1.5 text-sm font-bold tracking-wider",
  };

  return (
    <span
      className={`inline-flex items-center uppercase font-mono rounded border ${sizeStyles[size]} ${style} ${className}`}
    >
      {children}
    </span>
  );
}

export function SeverityDot({ severity }) {
  const sev = (severity || "").toLowerCase();
  const colors = {
    critical: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
    high: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
    medium: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    low: "bg-blue-400",
    info: "bg-gray-400",
    clean: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  };

  const bg = colors[sev] || colors.clean;
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${bg}`} />;
}
