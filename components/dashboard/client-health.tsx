"use client";

import { useState } from "react";
import { HealthSummary } from "./health-summary";
import type { ClientHealth, HealthAlert, HealthStatus, Intelligence } from "@/lib/types";

// Wraps HealthSummary with local state for the client detail page.
// Manages health data, alerts, and the AI-generated description.

interface ClientHealthTabProps {
  clientId: string;
  clientName?: string;
  intelligence?: Intelligence[];
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

export function ClientHealthTab({ clientId, clientName, intelligence }: ClientHealthTabProps) {
  const [health, setHealth] = useState(placeholderHealth);
  const [alerts, setAlerts] = useState(placeholderAlerts);
  const [isGenerating, setIsGenerating] = useState(false);

  void clientId; // Will be used for API calls

  function handleUpdateStatus(status: HealthStatus) {
    setHealth((prev) => ({ ...prev, status }));
  }

  function handleUpdateScore(score: number) {
    setHealth((prev) => ({ ...prev, satisfaction_score: score }));
  }

  function handleUpdateNotes(notes: string) {
    setHealth((prev) => ({ ...prev, notes }));
  }

  function handleAcknowledgeAlert(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }

  async function handleGenerateDescription() {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/health-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intelligence: intelligence ?? [],
          clientName: clientName ?? "this account",
          healthContext: {
            status: health.status,
            satisfaction_score: health.satisfaction_score,
            renewal_date: health.renewal_date,
            last_positive_signal: health.last_positive_signal,
            last_negative_signal: health.last_negative_signal,
            alerts: alerts.map((a) => ({ severity: a.severity, message: a.message })),
          },
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setHealth((prev) => ({ ...prev, notes: data }));
      }
    } catch (err) {
      console.error("Failed to generate health description:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <HealthSummary
      health={health}
      alerts={alerts}
      onUpdateStatus={handleUpdateStatus}
      onUpdateScore={handleUpdateScore}
      onUpdateNotes={handleUpdateNotes}
      onAcknowledgeAlert={handleAcknowledgeAlert}
      onGenerateDescription={handleGenerateDescription}
      isGenerating={isGenerating}
    />
  );
}
