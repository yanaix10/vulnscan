import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
          {/* shadcn Collapsible Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto">
              <AppRoutes />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
