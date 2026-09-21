import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Wifi, WifiOff, Sun, Moon } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { request } from "../api/client";
import { useTheme } from "../context/ThemeContext";

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
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
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="text-lg font-bold text-foreground tracking-wide font-sans">
          {getPageTitle()}
        </h1>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-beacon" />
              <span>API Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>API Offline</span>
            </span>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={theme === "light" ? "Switch to Dark Theme" : "Switch to White Light Theme"}
          className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Quick New Scan CTA */}
        {location.pathname !== "/scans/new" && (
          <Link to="/scans/new">
            <Button size="sm" variant="default" className="shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              New Scan
            </Button>
          </Link>
        )}

        {/* User avatar - refined neutral branding */}
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
