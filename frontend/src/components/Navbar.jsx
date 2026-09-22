import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, ShieldAlert, Globe, PanelLeft } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { request } from "../api/client";
import { useTarget } from "../context/TargetContext";

export function Navbar() {
  const location = useLocation();
  const { selectedTarget } = useTarget();
  const { open, toggleSidebar } = useSidebar();
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        await request("/");
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    }
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path.startsWith("/targets")) return "Targets Management";
    if (path === "/scans/new") return "New Scan";
    if (path.includes("/progress")) return "Scan Execution Progress";
    if (path.includes("/findings")) return "Vulnerability Findings";
    if (path.startsWith("/scans")) return "Scans History";
    if (path.startsWith("/reports")) return "Security Reports";
    return "Dashboard";
  };


  return (
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md flex items-center justify-between sticky top-0 z-40 shadow-2xs w-full">
      <div className="flex items-center h-full min-w-0 flex-1">
        {/* Left Section: fixed w-64 aligned with sidebar, brand mark and toggle remain permanently in place */}
        <div className="h-full w-64 px-4 border-r border-border flex items-center justify-between shrink-0">
          {/* Brand mark */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-2xs shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-wider text-sm font-mono text-foreground flex items-center gap-1.5 truncate">
              VULNSCAN <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">DAST</span>
            </span>
          </Link>

          {/* Toggle button placed right on the border edge, never moves */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={open ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={open ? "Collapse Sidebar" : "Expand Sidebar"}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              open 
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/70" 
                : "text-foreground bg-muted/60 hover:bg-muted"
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Space, then Dashboard / Page title with NO slash */}
        <div className="pl-6 flex items-center min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-foreground font-sans tracking-tight truncate">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health status pill with animated live beacon */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
          apiOnline 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40" 
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40"
        }`}>
          {apiOnline ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>API Offline</span>
            </span>
          )}
        </div>

        {/* Quick New Scan CTA */}
        {location.pathname !== "/scans/new" && (
          <Link to="/scans/new">
            <Button size="sm" variant="default" className="shadow-xs text-xs font-semibold gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Scan</span>
            </Button>
          </Link>
        )}

        {/* User avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono font-bold text-xs text-primary shadow-xs cursor-pointer select-none"
          title="Security Operator (JD)"
        >
          JD
        </div>
      </div>
    </header>
  );
}

export default Navbar;
