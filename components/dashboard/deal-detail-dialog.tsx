"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stageConfig } from "./deal-card";
import type { Deal } from "@/lib/types";

// Read-only dialog showing all deal fields with an "Edit" button.

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface DealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal & { clients?: { name: string } | null };
  onEdit: () => void;
}

export function DealDetailDialog({
  open,
  onOpenChange,
  deal,
  onEdit,
}: DealDetailDialogProps) {
  const stage = stageConfig[deal.stage];
  const closeDateLabel = deal.close_date
    ? new Date(deal.close_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const createdLabel = new Date(deal.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-snug">{deal.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Stage</p>
              <Badge variant="secondary" className={stage.className + " text-xs"}>
                {stage.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-medium">{formatCurrency(deal.amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {closeDateLabel && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Close Date</p>
                <p className="text-sm">{closeDateLabel}</p>
              </div>
            )}
            {deal.clients?.name && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Account</p>
                <p className="text-sm">{deal.clients.name}</p>
              </div>
            )}
          </div>

          {deal.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{deal.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
            <p className="text-sm">{createdLabel}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
