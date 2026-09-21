import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ShieldAlert, 
  Download, 
  Filter, 
  Eye, 
  FileText, 
  Code, 
  ArrowLeft,
  ChevronDown,
  Loader2 
} from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Table, TableRow, TableCell } from "../../components/Table";
import { getScan, getScanReportDownloadUrl } from "../../api/scans";
import { getFindingsByScan } from "../../api/findings";

export function FindingsList() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [scanData, findingsData] = await Promise.all([
          getScan(id),
          getFindingsByScan(id),
        ]);
        setScan(scanData);
        setFindings(findingsData || []);
      } catch (err) {
        console.error("Error loading findings", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const severities = ["all", "critical", "high", "medium", "low", "info"];

  const filteredFindings = findings.filter((f) => {
    if (selectedSeverity === "all") return true;
    return (f.severity || "").toLowerCase() === selectedSeverity;
  });

  const getSeverityCount = (sev) => {
    if (sev === "all") return findings.length;
    return findings.filter((f) => (f.severity || "").toLowerCase() === sev).length;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/scans/${id}/progress`)}
        className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scan Progress
      </button>

      {/* Header (Companion Guide Page 7) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-wide flex items-center gap-3">
            <span>Findings:</span>
            <span className="font-mono text-primary truncate max-w-xl">
              {scan?.target_url || `Scan #${id}`}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Total {findings.length} vulnerabilities detected during DAST analysis.
          </p>
        </div>

        {/* Download Report Button with Dropdown (Companion Guide Page 7) */}
        <div className="relative">
          <Button
            variant="default"
            onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
            <ChevronDown className="w-4 h-4" />
          </Button>

          {downloadDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-popover border border-border shadow-2xl p-1.5 z-30 font-mono text-xs">
              <a
                href={getScanReportDownloadUrl(id, "html")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDownloadDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-popover-foreground hover:bg-muted transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                HTML Report
              </a>
              <a
                href={getScanReportDownloadUrl(id, "json")}
                download={`report_scan_${id}.json`}
                onClick={() => setDownloadDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-popover-foreground hover:bg-muted transition-colors"
              >
                <Code className="w-4 h-4 text-blue-400" />
                JSON Findings
              </a>
              <a
                href={getScanReportDownloadUrl(id, "sarif")}
                download={`report_scan_${id}.sarif`}
                onClick={() => setDownloadDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-popover-foreground hover:bg-muted transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                SARIF (CI/CD GitHub)
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Severity Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {severities.map((sev) => {
          const count = getSeverityCount(sev);
          const isSelected = selectedSeverity === sev;

          return (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm border border-primary"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border hover:border-border/80"
              }`}
            >
              {sev} ({count})
            </button>
          );
        })}
      </div>

      {/* Findings Table */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-mono text-sm text-muted-foreground">Loading vulnerabilities...</p>
        </div>
      ) : (
        <Table
          headers={["CHECK", "SEVERITY", "URL", "PARAM", "ACTIONS"]}
          emptyMessage={`No findings found matching severity: ${selectedSeverity.toUpperCase()}.`}
        >
          {filteredFindings.map((finding) => (
            <TableRow key={finding.id}>
              <TableCell>
                <div className="font-mono font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                  <span>{finding.check_id}</span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant={finding.severity}>{finding.severity}</Badge>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-foreground/90 font-medium truncate max-w-sm block">
                  {finding.url}
                </span>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {finding.parameter || "—"}
                </span>
              </TableCell>

              <TableCell>
                <Link to={`/findings/${finding.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
