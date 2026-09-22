import React, { createContext, useContext, useState, useEffect } from "react";
import { listTargets } from "../api/targets";

const TargetContext = createContext(null);

export function TargetProvider({ children }) {
  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(() => {
    return localStorage.getItem("vulnscan_selected_target_id") || "all";
  });
  const [loading, setLoading] = useState(true);

  async function loadTargets() {
    try {
      const data = await listTargets();
      if (Array.isArray(data)) {
        setTargets(data);
      }
    } catch (err) {
      console.warn("Failed to load targets from backend", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTargets();
    const interval = setInterval(loadTargets, 15000);
    return () => clearInterval(interval);
  }, []);

  const selectTarget = (targetOrId) => {
    if (!targetOrId || targetOrId === "all") {
      setSelectedTargetId("all");
      localStorage.setItem("vulnscan_selected_target_id", "all");
    } else {
      const id = typeof targetOrId === "object" ? targetOrId.id : targetOrId;
      setSelectedTargetId(String(id));
      localStorage.setItem("vulnscan_selected_target_id", String(id));
    }
  };

  const selectedTarget = selectedTargetId === "all"
    ? null
    : targets.find(t => String(t.id) === String(selectedTargetId)) || null;

  return (
    <TargetContext.Provider
      value={{
        targets,
        selectedTarget,
        selectedTargetId,
        selectTarget,
        refreshTargets: loadTargets,
        loading
      }}
    >
      {children}
    </TargetContext.Provider>
  );
}

export function useTarget() {
  const context = useContext(TargetContext);
  if (!context) {
    throw new Error("useTarget must be used within a TargetProvider");
  }
  return context;
}
