import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "../features/dashboard/Dashboard";
import { TargetList } from "../features/targets/TargetList";
import { NewScanForm } from "../features/scans/NewScanForm";
import { ScanList } from "../features/scans/ScanList";
import { ScanProgress } from "../features/scans/ScanProgress";
import { FindingsList } from "../features/findings/FindingsList";
import { FindingDetail } from "../features/findings/FindingDetail";
import { ReportViewer } from "../features/reports/ReportViewer";
import SidebarNavPreview from "../components/ui/dashboard-sidebar";

export function AppRoutes() {
  return (
    <Routes>
      {/* Home / Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Target Management */}
      <Route path="/targets" element={<TargetList />} />

      {/* Scans */}
      <Route path="/scans" element={<ScanList />} />
      <Route path="/scans/new" element={<NewScanForm />} />
      <Route path="/scans/:id/progress" element={<ScanProgress />} />
      <Route path="/scans/:id/findings" element={<FindingsList />} />
      <Route path="/scans/:id/report" element={<ReportViewer />} />

      {/* Reports Root */}
      <Route path="/reports" element={<ReportViewer />} />

      {/* Finding Detail */}
      <Route path="/findings/:id" element={<FindingDetail />} />

      {/* 21st.dev Dashboard Sidebar Component Preview */}
      <Route path="/sidebar-preview" element={<SidebarNavPreview />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
