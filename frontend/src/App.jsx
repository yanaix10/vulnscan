import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { TargetProvider } from "./context/TargetContext";
import { SidebarProvider } from "./components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <ThemeProvider>
      <TargetProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
            {/* Top Bar across full width */}
            <Navbar />

            {/* Content area with pinned sliding sidebar and independently scrollable main page */}
            <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">
              <Sidebar />
              <main className="flex-1 min-h-0 overflow-y-auto ops-center-canvas">
                <AppRoutes />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TargetProvider>
    </ThemeProvider>
  );
}


