import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Play, Globe, Calendar, FileText } from "lucide-react";
import { Button } from "../../components/Button";
import { Table, TableRow, TableCell } from "../../components/Table";
import { Modal } from "../../components/Modal";
import { AddTargetForm } from "./AddTargetForm";
import { listTargets, deleteTarget } from "../../api/targets";
import { listScans } from "../../api/scans";

export function TargetList() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [targetData, scanData] = await Promise.all([
        listTargets(),
        listScans().catch(() => []),
      ]);
      setTargets(targetData || []);
      setScans(scanData || []);
    } catch (err) {
      console.error("Error loading targets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (targetId) => {
    if (!window.confirm("Are you sure you want to delete this target and its scan records?")) return;
    try {
      setDeleteLoadingId(targetId);
      await deleteTarget(targetId);
      setTargets((prev) => prev.filter((t) => t.id !== targetId));
    } catch (err) {
      alert("Failed to delete target: " + err.message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getScanCountForTarget = (targetId) => {
    return scans.filter((s) => s.target_id === targetId).length;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-wide">
            Targets
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Authorized web applications and APIs configured for security testing.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} variant="default">
          <Plus className="w-4 h-4" />
          Add Target
        </Button>
      </div>

      <Table
        headers={["URL", "NOTES", "ADDED", "SCANS", "ACTIONS"]}
        emptyMessage="No targets registered yet. Click '+ Add Target' to register an endpoint."
      >
        {targets.map((target) => {
          const scanCount = getScanCountForTarget(target.id);

          return (
            <TableRow key={target.id}>
              <TableCell>
                <div className="flex items-center gap-2.5 font-mono text-sm font-semibold text-foreground">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate max-w-md">{target.base_url}</span>
                </div>
              </TableCell>

              <TableCell>
                <span className="text-muted-foreground text-xs truncate max-w-xs block">
                  {target.notes || "—"}
                </span>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {target.added_at ? new Date(target.added_at).toLocaleDateString() : "—"}
                </span>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  {scanCount}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/scans/new?target_id=${target.id}`)}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Scan
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteLoadingId === target.id}
                    onClick={() => handleDelete(target.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Del
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>

      {/* Add Target Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Authorized Target"
      >
        <AddTargetForm
          onTargetAdded={(newTarget) => {
            setTargets((prev) => [newTarget, ...prev]);
            setIsAddModalOpen(false);
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
