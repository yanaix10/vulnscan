import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityDot } from "@/components/Badge";
import { Table, TableRow, TableCell } from "@/components/Table";
import { listScans } from "@/api/scans";

export function ScanList() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const data = await listScans();
      setScans(data || []);
    } catch (err) {
      console.error("Failed to load scans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-wide">
            Scans History
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Historical audit execution log and live running security assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchScans} loading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link to="/scans/new">
            <Button variant="default">
              <Play className="w-4 h-4 fill-current" />
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      <Table
        headers={["ID", "TARGET", "STATUS", "PAGES", "FINDINGS BREAKDOWN", "STARTED", "ACTIONS"]}
        emptyMessage="No scans executed yet. Click 'New Scan' to run your first test."
      >
        {scans.map((scan) => {
          let highestSev = "clean";
          if (scan.findings_count) {
            if (scan.findings_count.critical > 0) highestSev = "critical";
            else if (scan.findings_count.high > 0) highestSev = "high";
            else if (scan.findings_count.medium > 0) highestSev = "medium";
            else if (scan.findings_count.low > 0) highestSev = "low";
            else if (scan.findings_count.info > 0) highestSev = "info";
          }

          const isRunning = scan.status === "running" || scan.status === "queued";
          const statusVariant =
            scan.status === "failed"
              ? "destructive"
              : scan.status === "completed"
              ? "secondary"
              : "outline";

          return (
            <TableRow key={scan.id}>
              <TableCell>
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  #{scan.id}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2.5 font-mono text-sm font-semibold text-foreground">
                  <SeverityDot severity={highestSev} />
                  <span className="truncate max-w-xs">
                    {scan.target_url || `Target #${scan.target_id}`}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant={statusVariant} className="font-mono uppercase text-[10px]">
                  {scan.status}
                </Badge>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-foreground/90 font-medium">
                  {scan.pages_crawled}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {scan.findings_count?.critical > 0 && (
                    <Badge variant="destructive">
                      {scan.findings_count.critical} Crit
                    </Badge>
                  )}
                  {scan.findings_count?.high > 0 && (
                    <Badge variant="destructive">
                      {scan.findings_count.high} High
                    </Badge>
                  )}
                  {scan.findings_count?.medium > 0 && (
                    <Badge variant="secondary">
                      {scan.findings_count.medium} Med
                    </Badge>
                  )}
                  {scan.findings_count?.low > 0 && (
                    <Badge variant="outline">
                      {scan.findings_count.low} Low
                    </Badge>
                  )}
                  {(scan.findings_count?.total === 0 || !scan.findings_count) && (
                    <span className="text-muted-foreground italic">0 findings</span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(scan.started_at).toLocaleString()}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <Link to={`/scans/${scan.id}/progress`}>
                      <Button size="sm" variant="outline">
                        Live Progress
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to={`/scans/${scan.id}/findings`}>
                        <Button size="sm" variant="secondary">
                          Findings ({scan.findings_count?.total || 0})
                        </Button>
                      </Link>
                      <Link to={`/scans/${scan.id}/report`}>
                        <Button size="sm" variant="ghost" title="View Report">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}
