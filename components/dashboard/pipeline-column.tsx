"use client";

import { DealCard } from "./deal-card";
import type { Deal, DealStage } from "@/lib/types";

// A vertical column for one pipeline stage. Renders a header
// with the stage name and count, then deal cards below it.

interface PipelineColumnProps {
  stage: DealStage;
  label: string;
  deals: (Deal & { clients?: { name: string } | null })[];
  totalValue: number;
  onStageChange?: (dealId: string, newStage: DealStage) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PipelineColumn({
  label,
  deals,
  totalValue,
  onStageChange,
}: PipelineColumnProps) {
  return (
    <div className="flex-1 min-w-[250px]">
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onStageChange={onStageChange} />
        ))}
        {deals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
            No deals
          </p>
        )}
      </div>
    </div>
  );
}
