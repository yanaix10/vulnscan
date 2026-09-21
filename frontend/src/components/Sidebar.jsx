import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Crosshair, 
  Radar, 
  FileText,
  Terminal
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar(props) {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Targets", path: "/targets", icon: Crosshair },
    { label: "Scans", path: "/scans", icon: Radar },
    { label: "Reports", path: "/reports", icon: FileText },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar" {...props}>
      {/* SidebarHeader: Shield logo with Brand Accent + Brand title */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold tracking-widest text-base text-foreground font-mono flex items-center gap-1.5">
              SCANNER <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">DAST</span>
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* SidebarContent: Nav Group with Dashboard, Targets, Scans, Reports */}
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      tooltip={item.label}
                      className={isActive ? "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"}
                    >
                      <NavLink to={item.path} end={item.path === "/"}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* SidebarFooter: Status line */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground group-data-[collapsible=icon]:hidden">
          <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">OWASP Top 10 Engine</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 group-data-[collapsible=icon]:hidden">
          v1.0.0 · Core Active
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar as Sidebar };
