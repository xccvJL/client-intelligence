"use client";

import { Button } from "@/components/ui/button";

// Floating bar that appears when items are selected in a list.
// Shows the count of selected items and available bulk actions.

interface BulkActionBarProps {
  selectedCount: number;
  onMarkDone?: () => void;
  onReassign?: () => void;
  onDelete?: () => void;
  onClearSelection: () => void;
  actions?: { label: string; onClick: () => void; variant?: "default" | "outline" | "destructive" }[];
}

export function BulkActionBar({
  selectedCount,
  onMarkDone,
  onReassign,
  onDelete,
  onClearSelection,
  actions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background shadow-lg px-4 py-3">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-border" />

      {onMarkDone && (
        <Button size="sm" variant="outline" onClick={onMarkDone}>
          Mark Done
        </Button>
      )}
      {onReassign && (
        <Button size="sm" variant="outline" onClick={onReassign}>
          Reassign
        </Button>
      )}
      {actions?.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant ?? "outline"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
      {onDelete && (
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      )}

      <div className="h-4 w-px bg-border" />

      <Button size="sm" variant="ghost" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
}
