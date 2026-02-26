"use client";

import { useEffect, useState } from "react";
import { HealthSummary } from "./health-summary";
import type { ClientHealth, HealthAlert, HealthStatus, Intelligence } from "@/lib/types";
import { useTeamContext } from "./team-context";

// Wraps HealthSummary with API-backed state for the client detail page.

interface ClientHealthTabProps {
  clientId: string;
  clientName?: string;
  intelligence?: Intelligence[];
}

function createDefaultHealth(clientId: string): ClientHealth {
  const timestamp = new Date().toISOString();
  return {
    id: `health-${clientId}`,
    client_id: clientId,
    status: "healthy",
    satisfaction_score: 7,
    renewal_date: null,
    last_positive_signal: null,
    last_negative_signal: null,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function ClientHealthTab({ clientId, clientName, intelligence }: ClientHealthTabProps) {
  const { getRequestHeaders } = useTeamContext();
  const [health, setHealth] = useState<ClientHealth>(createDefaultHealth(clientId));
  const [alerts, setAlerts] = useState<(HealthAlert & { clients?: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const [healthRes, alertsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/health`, { headers: getRequestHeaders() }),
          fetch(`/api/alerts?client_id=${clientId}`, { headers: getRequestHeaders() }),
        ]);

        const healthJson = (await healthRes.json()) as { data?: ClientHealth; error?: string };
        const alertsJson = (await alertsRes.json()) as {
          data?: (HealthAlert & { clients?: { name: string } | null })[];
          error?: string;
        };

        if (!healthRes.ok) {
          throw new Error(healthJson.error ?? "Failed to load health");
        }
        if (!alertsRes.ok) {
          throw new Error(alertsJson.error ?? "Failed to load alerts");
        }

        setHealth(healthJson.data ?? createDefaultHealth(clientId));
        setAlerts(alertsJson.data ?? []);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load health data");
        setHealth(createDefaultHealth(clientId));
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [clientId, getRequestHeaders]);

  async function persistHealth(
    updates: Partial<Pick<ClientHealth, "status" | "satisfaction_score" | "renewal_date" | "notes">>
  ) {
    const res = await fetch(`/api/clients/${clientId}/health`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getRequestHeaders(),
      },
      body: JSON.stringify(updates),
    });

    const json = (await res.json()) as { data?: ClientHealth; error?: string };
    if (!res.ok || !json.data) {
      throw new Error(json.error ?? "Failed to update health");
    }

    return json.data;
  }

  function updateHealthWithRollback(
    updates: Partial<Pick<ClientHealth, "status" | "satisfaction_score" | "renewal_date" | "notes">>
  ) {
    setPageError(null);
    const previous = health;
    setHealth((prev) => ({ ...prev, ...updates }));

    void (async () => {
      try {
        const persisted = await persistHealth(updates);
        setHealth((prev) => ({ ...prev, ...persisted }));
      } catch (error) {
        setHealth(previous);
        setPageError(error instanceof Error ? error.message : "Failed to update health");
      }
    })();
  }

  function handleUpdateStatus(status: HealthStatus) {
    updateHealthWithRollback({ status });
  }

  function handleUpdateScore(score: number) {
    updateHealthWithRollback({ satisfaction_score: score });
  }

  function handleUpdateNotes(notes: string) {
    updateHealthWithRollback({ notes });
  }

  function handleAcknowledgeAlert(alertId: string) {
    setPageError(null);
    const previous = alerts;

    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );

    void (async () => {
      try {
        const res = await fetch(`/api/alerts/${alertId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getRequestHeaders(),
          },
          body: JSON.stringify({ acknowledged: true }),
        });

        const json = (await res.json()) as { data?: HealthAlert; error?: string };
        if (!res.ok || !json.data) {
          throw new Error(json.error ?? "Failed to acknowledge alert");
        }

        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? { ...alert, ...json.data! } : alert
          )
        );
      } catch (error) {
        setAlerts(previous);
        setPageError(error instanceof Error ? error.message : "Failed to acknowledge alert");
      }
    })();
  }

  async function handleGenerateDescription() {
    setIsGenerating(true);
    setPageError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/health-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({
          intelligence: intelligence ?? [],
          clientName: clientName ?? "this account",
          healthContext: {
            status: health.status,
            satisfaction_score: health.satisfaction_score,
            renewal_date: health.renewal_date,
            last_positive_signal: health.last_positive_signal,
            last_negative_signal: health.last_negative_signal,
            alerts: alerts.map((alert) => ({
              severity: alert.severity,
              message: alert.message,
            })),
          },
        }),
      });

      const json = (await res.json()) as { data?: string; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to generate health description");
      }

      const generatedNotes = json.data;
      setHealth((prev) => ({ ...prev, notes: generatedNotes }));

      try {
        const persisted = await persistHealth({ notes: generatedNotes });
        setHealth((prev) => ({ ...prev, ...persisted }));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to persist health notes");
      }
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to generate health description"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading health...</p>;
  }

  return (
    <div className="space-y-3">
      {pageError && <p className="text-sm text-destructive">{pageError}</p>}
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
    </div>
  );
}
