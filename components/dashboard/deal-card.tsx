"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Deal, DealStage } from "@/lib/types";

// Compact card for a single deal — shows title, stage badge,
// amount, close date, and the client name.

const stageConfig: Record<DealStage, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  proposal: { label: "Proposal", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  active: { label: "Active", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  closed_won: { label: "Won", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  closed_lost: { label: "Lost", className: "bg-gray-100 text-gray-500 hover:bg-gray-100" },
};

interface DealCardProps {
  deal: Deal & { clients?: { name: string } | null };
  onStageChange?: (dealId: string, newStage: DealStage) => void;
}

function formatCurrency(amount: number | null) {
  if (amount === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function DealCard({ deal, onStageChange }: DealCardProps) {
  const stage = stageConfig[deal.stage];
  const closeDateLabel = deal.close_date
    ? new Date(deal.close_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  // Determine the next stage for click-to-advance
  const stageOrder: DealStage[] = ["lead", "proposal", "active", "closed_won"];
  const currentIdx = stageOrder.indexOf(deal.stage);
  const nextStage = currentIdx >= 0 && currentIdx < stageOrder.length - 1
    ? stageOrder[currentIdx + 1]
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {deal.title}
          </CardTitle>
          <Badge variant="secondary" className={stage.className + " text-xs shrink-0"}>
            {stage.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{deal.clients?.name ?? "No client"}</span>
          <div className="flex items-center gap-2">
            {formatCurrency(deal.amount) && (
              <span className="font-medium text-foreground">
                {formatCurrency(deal.amount)}
              </span>
            )}
            {closeDateLabel && <span>{closeDateLabel}</span>}
          </div>
        </div>
        {nextStage && onStageChange && (
          <button
            onClick={() => onStageChange(deal.id, nextStage)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Move to {stageConfig[nextStage].label}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export { stageConfig };
