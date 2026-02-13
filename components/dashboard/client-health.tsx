"use client";

import { useState } from "react";
import { HealthSummary } from "./health-summary";
import type { ClientHealth, HealthAlert, HealthStatus } from "@/lib/types";

// Wraps HealthSummary with local state for the client detail page.
// Uses placeholder data; will connect to API routes once Supabase is live.

interface ClientHealthTabProps {
  clientId: string;
}

const placeholderHealth: ClientHealth = {
  id: "h1",
  client_id: "1",
  status: "healthy",
  satisfaction_score: 8,
  renewal_date: "2026-06-15",
  last_positive_signal: "2026-02-10T00:00:00Z",
  last_negative_signal: null,
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-02-10",
};

const placeholderAlerts: (HealthAlert & { clients?: { name: string } | null })[] = [
  {
    id: "a1",
    client_id: "1",
    intelligence_id: "i2",
    alert_type: "risk_topic",
    severity: "warning",
    message: "Risk topics detected: capacity, concerns",
    acknowledged: false,
    created_at: "2026-02-07T00:00:00Z",
    clients: { name: "Acme Corp" },
  },
];

export function ClientHealthTab({ clientId }: ClientHealthTabProps) {
  const [health, setHealth] = useState(placeholderHealth);
  const [alerts, setAlerts] = useState(placeholderAlerts);

  void clientId; // Will be used for API calls

  function handleUpdateStatus(status: HealthStatus) {
    setHealth((prev) => ({ ...prev, status }));
  }

  function handleUpdateScore(score: number) {
    setHealth((prev) => ({ ...prev, satisfaction_score: score }));
  }

  function handleAcknowledgeAlert(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }

  return (
    <HealthSummary
      health={health}
      alerts={alerts}
      onUpdateStatus={handleUpdateStatus}
      onUpdateScore={handleUpdateScore}
      onAcknowledgeAlert={handleAcknowledgeAlert}
    />
  );
}
