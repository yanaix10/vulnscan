import { useState, useEffect, useRef } from "react";
import { getScan } from "../api/scans";

export function useScanPolling(scanId, pollIntervalMs = 1500) {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!scanId) return;

    let isMounted = true;

    async function fetchScanData() {
      try {
        const data = await getScan(scanId);
        if (!isMounted) return;

        setScan(data);
        setLoading(false);

        // Terminal states: stop polling
        if (data.status === "completed" || data.status === "failed") {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to poll scan status");
        setLoading(false);
      }
    }

    // Initial immediate fetch
    fetchScanData();

    // Setup polling interval
    timerRef.current = setInterval(fetchScanData, pollIntervalMs);

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [scanId, pollIntervalMs]);

  return { scan, loading, error, isComplete: scan?.status === "completed", isFailed: scan?.status === "failed" };
}
