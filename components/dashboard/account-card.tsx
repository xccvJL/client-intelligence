"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "./health-badge";
import type { AccountStatus, DealStage, HealthStatus } from "@/lib/types";

// Card for the Accounts list view. Shows account name, domain,
// health status, current deal stages, total deal value, and counts.

const stageLabels: Record<DealStage, string> = {
  lead: "Lead",
  proposal: "Proposal",
  active: "Active",
  closed_won: "Won",
  closed_lost: "Lost",
};

const stageColors: Record<DealStage, string> = {
  lead: "bg-blue-100 text-blue-700",
  proposal: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-gray-100 text-gray-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface AccountCardProps {
  name: string;
  domain: string;
  status: AccountStatus;
  healthStatus?: HealthStatus;
  dealStages: DealStage[];
  dealValue: number;
  taskCount: number;
  intelligenceCount: number;
}

export function AccountCard({
  name,
  domain,
  status,
  healthStatus,
  dealStages,
  dealValue,
  taskCount,
  intelligenceCount,
}: AccountCardProps) {
  // Deduplicate stages for display
  const uniqueStages = [...new Set(dealStages)];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{domain}</p>
          </div>
          <div className="flex items-center gap-2">
            {status === "archived" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">
                Archived
              </Badge>
            )}
            {healthStatus && <HealthBadge status={healthStatus} />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {uniqueStages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {uniqueStages.map((stage) => (
              <Badge
                key={stage}
                variant="secondary"
                className={`${stageColors[stage]} text-xs`}
              >
                {stageLabels[stage]}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {dealValue > 0 && (
              <span className="font-medium text-foreground">
                {formatCurrency(dealValue)}
              </span>
            )}
            <span>{taskCount} tasks</span>
            <span>{intelligenceCount} intel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
