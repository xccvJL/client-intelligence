"use client";

import { useState } from "react";
import { DealCard } from "./deal-card";
import type { Deal, DealStage } from "@/lib/types";

// A vertical column for one pipeline stage. Renders a header
// with the stage name and count, then deal cards below it.
// Acts as a drop zone for drag-and-drop deal movement.

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
  stage,
  label,
  deals,
  totalValue,
  onStageChange,
}: PipelineColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId && onStageChange) {
      onStageChange(dealId, stage);
    }
  }

  return (
    <div
      className={`flex-1 min-w-[250px] rounded-lg p-2 transition-colors ${
        dragOver
          ? "bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/30 dark:ring-blue-700"
          : "bg-muted/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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

      <div className="space-y-2 min-h-[100px]">
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
