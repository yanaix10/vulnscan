import React, { useState } from "react";
import { Button } from "../../components/Button";
import { createTarget } from "../../api/targets";

export function AddTargetForm({ onTargetAdded, onCancel }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newTarget = await createTarget({
        base_url: baseUrl.trim(),
        notes: notes.trim(),
      });
      onTargetAdded(newTarget);
    } catch (err) {
      setError(err.message || "Failed to create target");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Target Base URL *
        </label>
        <input
          type="url"
          required
          placeholder="https://staging.paygate.example.com"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Must be an authorized testing host or staging environment.
        </p>
      </div>

      <div>
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Notes / Environment Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="e.g. My own staging environment, payment service staging"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="default" loading={loading}>
          Save Target
        </Button>
      </div>
    </form>
  );
}
