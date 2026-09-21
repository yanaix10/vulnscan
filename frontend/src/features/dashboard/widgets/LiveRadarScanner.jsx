import React, { useState } from "react";
import { Radar, ShieldCheck, Zap, Radio, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LiveRadarScanner({ targetsCount = 0, scansCount = 0 }) {
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  const handlePing = () => {
    setIsPinging(true);
    setPingSuccess(false);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 2000);
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
              DAST Telemetry Radar
            </span>
            <span className="text-[11px] font-mono text-muted-foreground block">
              Active Surface Monitoring
            </span>
          </div>
        </div>

        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-beacon mr-1.5" />
          Live Active
        </Badge>
      </div>

      {/* Radar Graphic Area */}
      <div className="relative flex items-center justify-center py-4 my-auto">
        <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full border border-border/80 relative flex items-center justify-center bg-slate-50/50 dark:bg-zinc-950/40 shadow-inner overflow-hidden">
          
          {/* Concentric distance rings */}
          <div className="absolute inset-4 rounded-full border border-border/60" />
          <div className="absolute inset-10 rounded-full border border-border/60" />
          <div className="absolute inset-16 rounded-full border border-border/40" />

          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-border/50 -translate-y-1/2" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-border/50 -translate-x-1/2" />

          {/* Sweeping Radar Beam */}
          <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none origin-center">
            <div 
              className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
              style={{
                background: "conic-gradient(from 270deg at 0% 100%, rgba(99, 102, 241, 0.45) 0deg, rgba(99, 102, 241, 0.1) 45deg, transparent 90deg)"
              }}
            />
            {/* Leading ray line */}
            <div className="absolute top-0 left-1/2 w-[1.5px] h-1/2 bg-primary shadow-[0_0_8px_#6366f1]" />
          </div>

          {/* Simulated Endpoint Blips (Ping Nodes) */}
          <div className="absolute top-12 left-16 w-2.5 h-2.5 rounded-full bg-primary/80 animate-pulse-beacon shadow-[0_0_6px_#6366f1]" title="Target Root: /" />
          <div className="absolute bottom-14 right-14 w-2 h-2 rounded-full bg-amber-500 animate-pulse-beacon shadow-[0_0_6px_#f59e0b]" title="Auth Endpoint: /login.php" />
          <div className="absolute top-20 right-16 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_6px_#ef4444]" title="Vulnerable Node: /index.php" />
          <div className="absolute bottom-16 left-12 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_6px_#3b82f6]" title="API Route: /api/v1" />

          {/* Dynamic Ping Ripple on button click */}
          {isPinging && (
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping pointer-events-none" />
          )}

          {/* Center Sensor Hub */}
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center z-10 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border mt-3 text-center">
        <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
          <span className="block text-[10px] font-mono text-muted-foreground uppercase">Engine</span>
          <span className="text-xs font-mono font-bold text-foreground">Playwright</span>
        </div>
        <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
          <span className="block text-[10px] font-mono text-muted-foreground uppercase">Rules</span>
          <span className="text-xs font-mono font-bold text-primary">12 Checks</span>
        </div>
        <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
          <span className="block text-[10px] font-mono text-muted-foreground uppercase">Targets</span>
          <span className="text-xs font-mono font-bold text-foreground">{targetsCount} Active</span>
        </div>
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={handlePing}
        disabled={isPinging}
        className="mt-3 w-full py-2 px-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 text-xs font-mono font-semibold text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:border-primary/40 active:scale-98"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-primary ${isPinging ? "animate-spin" : ""}`} />
        <span>{isPinging ? "Broadcasting Ping..." : pingSuccess ? "Pulse Acknowledged (24ms)" : "Ping Attack Surface"}</span>
      </button>
    </div>
  );
}
