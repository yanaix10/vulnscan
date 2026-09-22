import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Crosshair, 
  Radar, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ShieldAlert, 
  Plus,
  Check,
  Sun,
  Moon,
  Globe
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "../context/ThemeContext";
import { useTarget } from "../context/TargetContext";
import { Switch } from "@/components/ui/switch";
import { listScans } from "../api/scans";
import { request } from "../api/client";

// Backend-synced Target Scope Switcher (Workspace Switcher)
function TargetScopeSwitcher() {
  const { targets, selectedTarget, selectedTargetId, selectTarget } = useTarget();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const isAll = selectedTargetId === "all" || !selectedTarget;

  // Helper to format clean display URL
  const formatUrl = (url) => {
    if (!url) return "No target registered";
    try {
      const parsed = new URL(url);
      return parsed.host || url;
    } catch {
      return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
  };

  return (
    <div className="relative mb-3">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl bg-muted/40 border border-border/70 hover:bg-muted/70 hover:border-border transition-all cursor-pointer select-none group shadow-2xs"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden text-left min-w-0 flex-1">
            <span className="text-[12.5px] font-semibold leading-tight text-foreground truncate">
              {isAll ? "Global Workspace" : formatUrl(selectedTarget?.base_url)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
              {isAll ? `All Targets Scope (${targets.length})` : (selectedTarget?.notes || "Active Target Scope")}
            </span>
          </div>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? 'rotate-180' : ''}`} 
          strokeWidth={1.5} 
        />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-card border border-border rounded-xl shadow-xl z-50 py-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
              <span>Workspaces / Scope</span>
              <span className="text-primary font-bold">{targets.length} targets</span>
            </div>

            {/* Global Scope Option */}
            <div 
              onClick={() => {
                selectTarget("all");
                setIsOpen(false);
              }}
              className={`px-3 py-2 mx-1 text-[12px] rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                isAll 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="truncate font-semibold text-[12px]">All Workspaces (Global)</span>
                <span className="text-[10px] text-muted-foreground truncate">Show scans & findings across all targets</span>
              </div>
              {isAll && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>

            <div className="h-px bg-border/60 my-1 mx-2" />

            <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
              {targets.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                  No targets registered yet
                </div>
              ) : (
                targets.map(target => {
                  const isCurrent = !isAll && String(selectedTarget?.id) === String(target.id);
                  return (
                    <div 
                      key={target.id}
                      onClick={() => {
                        selectTarget(target.id);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 mx-1 text-[12px] rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-foreground/80 hover:bg-muted'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate font-mono text-[11.5px]">{target.base_url}</span>
                        {target.notes && (
                          <span className="text-[10px] text-muted-foreground truncate">{target.notes}</span>
                        )}
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>

            <div className="h-px bg-border/60 my-1 mx-2" />
            <div 
              onClick={() => {
                setIsOpen(false);
                navigate("/targets");
              }}
              className="px-3 py-1.5 mx-1 text-[12px] font-medium text-primary hover:bg-primary/10 rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Manage / Add Target
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// NavItem Component supporting active routes, sub-items and aligned live badges
function NavItem({ item, activePath, onSelect, level = 0 }) {
  const hasChildren = !!item.children && item.children.length > 0;
  
  const isDirectActive = activePath === item.path || (item.path !== "/" && activePath.startsWith(item.path));
  const isChildActive = hasChildren && item.children.some(c => activePath === c.path || (c.path !== "/" && activePath.startsWith(c.path)));
  const isActive = isDirectActive || isChildActive;

  const [isOpen, setIsOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (item.path) {
      onSelect(item.path);
    }
  };

  const Icon = item.icon;

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 select-none
          ${isDirectActive && !hasChildren
            ? 'bg-primary/15 text-primary font-semibold shadow-2xs' 
            : isActive
              ? 'bg-black/5 dark:bg-white/10 text-foreground font-medium'
              : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
          }
        `}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon 
            className={`w-[17px] h-[17px] transition-colors shrink-0
              ${isDirectActive && !hasChildren ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
            `} 
            strokeWidth={1.75} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        {/* Right badge & Chevron with fixed spacing for vertical alignment */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.badge !== undefined && item.badge !== null && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold font-mono rounded-full bg-primary/10 text-primary border border-primary/20">
              {item.badge}
            </span>
          )}
          {hasChildren ? (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-90 text-foreground' : ''}`} 
              strokeWidth={2}
            />
          ) : (
            <span className="w-3.5 h-3.5 shrink-0" />
          )}
        </div>
      </div>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-border/60"
              style={{ left: `${level * 14 + 18}px` }}
            />
            {item.children.map(child => (
              <NavItem 
                key={child.id || child.path} 
                item={child} 
                activePath={activePath} 
                onSelect={onSelect} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Clean, Backend-Synced Sidebar Component
export function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, theme, setTheme } = useTheme();
  const { targets } = useTarget();

  // Connect to shadcn Sidebar context for toggle synchronization
  const { open: isSidebarOpen } = useSidebar();

  // Backend Infra Sync States
  const [scansCount, setScansCount] = useState(0);
  const [apiOnline, setApiOnline] = useState(true);

  // Sync scan count & health from backend
  useEffect(() => {
    let isMounted = true;

    async function syncBackendData() {
      try {
        const [scansData, healthData] = await Promise.allSettled([
          listScans(),
          request("/"),
        ]);

        if (!isMounted) return;

        if (scansData.status === "fulfilled" && Array.isArray(scansData.value)) {
          setScansCount(scansData.value.length);
        }

        if (healthData.status === "fulfilled") {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch (err) {
        if (isMounted) setApiOnline(false);
      }
    }

    syncBackendData();
    const interval = setInterval(syncBackendData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Pure, project-aligned navigation items (no extra dummy resources)
  const navItems = [
    { 
      id: "dashboard", 
      title: "Dashboard", 
      path: "/", 
      icon: LayoutDashboard 
    },
    { 
      id: "targets", 
      title: "Targets", 
      path: "/targets", 
      icon: Crosshair,
      badge: targets.length > 0 ? targets.length : null
    },
    { 
      id: "scans", 
      title: "Scans", 
      path: "/scans", 
      icon: Radar,
      badge: scansCount > 0 ? scansCount : null,
      children: [
        { id: "scans-all", title: "All Scans", path: "/scans", icon: Radar },
        { id: "scans-new", title: "New Scan", path: "/scans/new", icon: Plus },
      ]
    },
    { 
      id: "reports", 
      title: "Reports", 
      path: "/reports", 
      icon: FileText 
    }
  ];

  return (
    <aside 
      className={`h-full sticky top-0 bg-card border-r shrink-0 select-none overflow-hidden z-30 transition-[width,opacity,border-color] duration-300 ease-in-out ${
        isSidebarOpen 
          ? "w-64 opacity-100 border-border" 
          : "w-0 opacity-0 border-transparent pointer-events-none"
      }`}
    >
      {/* Symmetrically slides in when unhiding and slides out when hiding */}
      <div 
        className={`w-64 h-full p-3 flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          {/* Target / Workspace Scope Switcher at the top of the sidebar */}
          <TargetScopeSwitcher />

          {/* Navigation Items (Clean & Simple) */}
          <div className="flex flex-col gap-1 mt-2">
            <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/60 font-mono uppercase">
              Navigation
            </span>
            {navItems.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activePath={location.pathname} 
                onSelect={(path) => navigate(path)} 
              />
            ))}
          </div>
        </div>

        {/* Bottom Section: Single Theme Toggle & Live Backend Status (Always pinned at bottom) */}
        <div className="shrink-0 pt-3 border-t border-border flex flex-col gap-2 bg-card">
          {/* Dedicated Theme Switcher with Radix Switch */}
          <div
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
              }
            }}
          >
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-primary" strokeWidth={1.75} />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
              )}
              <span className="font-medium text-foreground">
                {theme === "dark" ? "Dark Theme" : "Light Theme"}
              </span>
            </div>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center"
            >
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
              />
            </div>
          </div>

          {/* Live Backend Infrastructure Sync Status */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${apiOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-foreground font-mono leading-none truncate">
                  {apiOnline ? "API Online" : "API Offline"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                  {apiOnline ? "127.0.0.1:8000" : "Server Disconnected"}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold shrink-0">
              v1.0
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { SidebarNav as Sidebar, SidebarNav as AppSidebar };
export default SidebarNav;

