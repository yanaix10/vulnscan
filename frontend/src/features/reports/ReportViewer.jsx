import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Code, 
  ShieldAlert, 
  ShieldCheck,
  ArrowLeft, 
  ExternalLink, 
  Copy,
  Check,
  Layers,
  Globe,
  Clock,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getScan, listScans, getScanReportDownloadUrl } from "../../api/scans";
import { getFindingsByScan } from "../../api/findings";
import { InteractiveReport } from "./InteractiveReport";
import { useTarget } from "../../context/TargetContext";

export function ReportViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedTarget, selectedTargetId } = useTarget();

  const [scanId, setScanId] = useState(id);
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const [viewMode, setViewMode] = useState("report"); // "report" or "raw"
  const [rawFormat, setRawFormat] = useState("html"); // "html", "json", "sarif"
  const [rawContent, setRawContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    if (id) {
      setScanId(id);
    }
  }, [id]);

  useEffect(() => {
    async function loadScansList() {
      try {
        const data = await listScans();
        setAllScans(data || []);
        if (!scanId && data && data.length > 0) {
          setScanId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load scans list", err);
      }
    }
    loadScansList();
  }, []);

  useEffect(() => {
    if (!scanId) {
      setLoading(false);
      return;
    }

    async function fetchScanDetails() {
      try {
        setLoading(true);
        const [scanData, findingsData] = await Promise.all([
          getScan(scanId),
          getFindingsByScan(scanId).catch(() => []),
        ]);
        setScan(scanData);
        setFindings(findingsData || []);

        if (viewMode === "raw") {
          const res = await fetch(getScanReportDownloadUrl(scanId, rawFormat));
          if (res.ok) {
            const text = await res.text();
            setRawContent(text);
          }
        }
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchScanDetails();
  }, [scanId, viewMode, rawFormat]);

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const htmlUrl = scanId ? getScanReportDownloadUrl(scanId, "html") : "";
  const jsonUrl = scanId ? getScanReportDownloadUrl(scanId, "json") : "";
  const sarifUrl = scanId ? getScanReportDownloadUrl(scanId, "sarif") : "";

  const displayScans = (selectedTargetId === "all" || !selectedTarget)
    ? allScans
    : allScans.filter(s => s.target_id === selectedTarget.id || s.target_url === selectedTarget.base_url);

  useEffect(() => {
    if (selectedTarget && displayScans.length > 0) {
      const currentInTarget = displayScans.some(s => String(s.id) === String(scanId));
      if (!currentInTarget) {
        setScanId(displayScans[0].id);
        navigate(`/scans/${displayScans[0].id}/report`);
      }
    }
  }, [selectedTargetId, allScans]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Sleek Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <button
            onClick={() => scanId ? navigate(`/scans/${scanId}/findings`) : navigate("/scans")}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Findings</span>
          </button>
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-sans tracking-tight">
              Security Scan Report
            </h1>
            {scan && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                scan.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {scan.status?.toUpperCase() || "COMPLETED"}
              </span>
            )}
          </div>
        </div>

        {/* Scan Selector & Unified Export Dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {displayScans.length > 0 && (
            <Select
              value={String(scanId || "")}
              onValueChange={(newId) => {
                setScanId(newId);
                navigate(`/scans/${newId}/report`);
              }}
            >
              <SelectTrigger className="w-[260px] h-9 text-xs font-mono bg-card border-border">
                <SelectValue placeholder="Select target scan..." />
              </SelectTrigger>
              <SelectContent>
                {displayScans.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    Scan #{s.id} · {s.target_url ? s.target_url.replace(/^https?:\/\//, "") : `Target ${s.target_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Export Report Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" className="gap-2 shadow-xs cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <a href={htmlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Download HTML</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={jsonUrl} download={`vulnscan_report_${scanId}.json`} className="flex items-center gap-2 cursor-pointer">
                  <Code className="w-4 h-4 text-blue-500" />
                  <span>Download JSON</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={sarifUrl} download={`vulnscan_report_${scanId}.sarif`} className="flex items-center gap-2 cursor-pointer">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Download SARIF</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Target Info Bar */}
      {scan && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <a 
                  href={scan.target_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-mono text-sm font-semibold text-foreground hover:text-primary transition-colors truncate flex items-center gap-1"
                >
                  <span>{scan.target_url}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Profile: <strong className="text-foreground">{scan.profile || "Full DAST"}</strong> · Max Depth: <strong className="text-foreground">{scan.max_depth || 3}</strong> · Crawled: <strong className="text-foreground">{scan.pages_crawled || 0} pages</strong>
              </span>
            </div>
          </div>

          {/* View Mode Toggle: Interactive Report vs Raw Preview */}
          <div className="flex items-center p-1 rounded-lg bg-muted border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("report")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === "report"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Interactive Report
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === "raw"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Raw Exports
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "report" ? (
        <InteractiveReport scan={scan} findings={findings} />
      ) : (
        /* Raw Exports Inspector */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {["html", "json", "sarif"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setRawFormat(fmt)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium uppercase transition-colors cursor-pointer ${
                    rawFormat === fmt
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>

          <div className="p-4 bg-zinc-950 max-h-[600px] overflow-auto">
            <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
              <code>{rawContent || "Loading raw export content..."}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}

export default ReportViewer;
