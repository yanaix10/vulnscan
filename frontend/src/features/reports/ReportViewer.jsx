import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Code, 
  ShieldAlert, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  Copy,
  Layers,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../../components/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getScan, listScans, getScanReportDownloadUrl } from "../../api/scans";
import { getFindingsByScan } from "../../api/findings";
import { InteractiveReport } from "./InteractiveReport";
import { API_BASE_URL } from "../../api/client";

export function ReportViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scanId, setScanId] = useState(id);
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const [activeTab, setActiveTab] = useState("interactive"); // "interactive", "html", "json", "sarif"
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
        console.error("Failed to load scans", err);
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

        // If JSON or SARIF tab is active, fetch raw content
        if (activeTab === "json" || activeTab === "sarif") {
          const res = await fetch(getScanReportDownloadUrl(scanId, activeTab));
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
  }, [scanId, activeTab]);

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const htmlUrl = scanId ? getScanReportDownloadUrl(scanId, "html") : "";
  const jsonUrl = scanId ? getScanReportDownloadUrl(scanId, "json") : "";
  const sarifUrl = scanId ? getScanReportDownloadUrl(scanId, "sarif") : "";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <button
            onClick={() => scanId ? navigate(`/scans/${scanId}/findings`) : navigate("/scans")}
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {scanId ? "Back to Findings" : "Back to Scans"}
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            <span>Security Scan Report</span>
            {scan && (
              <Badge variant={scan.status === "complete" ? "success" : "warning"}>
                {scan.status}
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Standardized vulnerability audit and compliance export (HTML · JSON · SARIF).
          </p>
        </div>

        {/* Scan Selector if multiple scans exist */}
        {allScans.length > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-xl">
            <span className="text-xs font-mono text-muted-foreground pl-2">Target Scan:</span>
            <Select
              value={String(scanId || "")}
              onValueChange={(newId) => {
                setScanId(newId);
                navigate(`/scans/${newId}/report`);
              }}
            >
              <SelectTrigger className="w-[300px] h-8 text-xs font-mono bg-background border-border text-foreground">
                <SelectValue placeholder="Select target scan..." />
              </SelectTrigger>
              <SelectContent>
                {allScans.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    Scan #{s.id} - {s.target_url || `Target ${s.target_id}`} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Target & Summary Banner */}
      {scan && (
        <div className="bg-card/60 border border-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">Audited Target</span>
            <div className="text-lg font-mono font-bold text-foreground break-all">
              {scan.target_url || "Target #" + scan.target_id}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Profile: <span className="text-foreground">{scan.profile || "full"}</span> | Depth: <span className="text-foreground">{scan.max_depth || 3}</span> | Pages Crawled: <span className="text-foreground">{scan.pages_crawled || 0}</span>
            </div>
          </div>

          {/* Quick Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                HTML
              </Button>
            </a>
            <a href={jsonUrl} download={`vulnscan_report_${scanId}.json`}>
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                JSON
              </Button>
            </a>
            <a href={sarifUrl} download={`vulnscan_report_${scanId}.sarif`}>
              <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                SARIF
              </Button>
            </a>
            <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="default" className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                New Tab
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("interactive")}
            className={`px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "interactive"
                ? "border-primary text-primary bg-muted/40"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            Audit Report
          </button>
          <button
            onClick={() => setActiveTab("html")}
            className={`px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "html"
                ? "border-primary text-primary bg-muted/40"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            HTML Preview
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "json"
                ? "border-primary text-primary bg-muted/40"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code className="w-4 h-4" />
            JSON Export
          </button>
          <button
            onClick={() => setActiveTab("sarif")}
            className={`px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "sarif"
                ? "border-primary text-primary bg-muted/40"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            SARIF (GitHub Security)
          </button>
        </div>

        {(activeTab === "json" || activeTab === "sarif") && (
          <Button size="sm" variant="ghost" onClick={handleCopy} className="text-xs font-mono">
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Raw
              </>
            )}
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[600px] shadow-xs relative">
        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-mono text-xs text-muted-foreground">Loading report render...</p>
          </div>
        ) : !scanId ? (
          <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 space-y-3">
            <FileText className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm font-mono text-muted-foreground">No scans available to view.</p>
            <Link to="/scans/new">
              <Button size="sm" variant="default">Launch a Scan</Button>
            </Link>
          </div>
        ) : activeTab === "interactive" ? (
          <div className="p-2 sm:p-4">
            <InteractiveReport scan={scan} findings={findings} />
          </div>
        ) : activeTab === "html" ? (
          <iframe
            title="Scan HTML Report"
            src={htmlUrl}
            className="w-full h-[750px] border-none bg-zinc-950 rounded-b-2xl"
          />
        ) : (
          <div className="p-4 overflow-auto max-h-[750px]">
            <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {rawContent || "Loading payload..."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
