import { Badge } from "@/components/ui/badge";
import type { HealthStatus } from "@/lib/types";

// Color-coded badge for client health status.
// Green = healthy, yellow = at-risk, red = churning.
// Same pattern as the existing sentiment-badge.tsx.

const healthConfig: Record<HealthStatus, { label: string; className: string }> = {
  healthy: {
    label: "Healthy",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  at_risk: {
    label: "At Risk",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  churning: {
    label: "Churning",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = healthConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
