"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "./health-badge";
import { AlertCard } from "./alert-card";
import type { ClientHealth, HealthAlert, HealthStatus } from "@/lib/types";

// Panel showing the big-picture health of a client:
// status badge, satisfaction score, renewal date with countdown,
// and a list of recent alerts.

interface HealthSummaryProps {
  health: ClientHealth;
  alerts: (HealthAlert & { clients?: { name: string } | null })[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onUpdateStatus?: (status: HealthStatus) => void;
  onUpdateScore?: (score: number) => void;
}

export function HealthSummary({
  health,
  alerts,
  onAcknowledgeAlert,
  onUpdateStatus,
  onUpdateScore,
}: HealthSummaryProps) {
  const renewalCountdown = health.renewal_date
    ? Math.ceil(
        (new Date(health.renewal_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Relationship Health</CardTitle>
            <HealthBadge status={health.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status selector */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2 mt-1.5">
              {(["healthy", "at_risk", "churning"] as HealthStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus?.(s)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    health.status === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground"
                  }`}
                >
                  {s === "at_risk" ? "At Risk" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Satisfaction score */}
          <div>
            <label className="text-sm font-medium">
              Satisfaction Score: {health.satisfaction_score}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={health.satisfaction_score}
              onChange={(e) => onUpdateScore?.(parseInt(e.target.value))}
              className="w-full mt-1.5 accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {/* Renewal date */}
          {health.renewal_date && (
            <div>
              <label className="text-sm font-medium">Renewal Date</label>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(health.renewal_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {renewalCountdown !== null && (
                  <span
                    className={
                      renewalCountdown <= 30
                        ? " text-red-600 font-medium"
                        : ""
                    }
                  >
                    {" "}
                    ({renewalCountdown > 0 ? `${renewalCountdown} days away` : "Past due"})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Signal timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Last positive signal</p>
              <p>
                {health.last_positive_signal
                  ? new Date(health.last_positive_signal).toLocaleDateString()
                  : "None"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last negative signal</p>
              <p>
                {health.last_negative_signal
                  ? new Date(health.last_negative_signal).toLocaleDateString()
                  : "None"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Alerts ({alerts.filter((a) => !a.acknowledged).length} unacknowledged)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={onAcknowledgeAlert}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
