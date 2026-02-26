"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HealthAlert, AlertSeverity } from "@/lib/types";

// Alert row — shows severity icon, message, timestamp, and
// an "Acknowledge" button to dismiss it.

const severityConfig: Record<AlertSeverity, { label: string; className: string; icon: string }> = {
  info: { label: "Info", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: "i" },
  warning: { label: "Warning", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300", icon: "!" },
  critical: { label: "Critical", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", icon: "!!" },
};

interface AlertCardProps {
  alert: HealthAlert & { clients?: { name: string } | null };
  onAcknowledge?: (alertId: string) => void;
}

export function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const severity = severityConfig[alert.severity];
  const date = new Date(alert.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2.5">
      <Badge variant="secondary" className={severity.className + " text-xs shrink-0"}>
        {severity.icon}
      </Badge>

      <div className="flex-1 min-w-0">
        <p className="text-sm">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {alert.clients?.name && <>{alert.clients.name} &middot; </>}
          {date}
        </p>
      </div>

      {!alert.acknowledged && onAcknowledge && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs shrink-0"
          onClick={() => onAcknowledge(alert.id)}
        >
          Acknowledge
        </Button>
      )}
    </div>
  );
}
