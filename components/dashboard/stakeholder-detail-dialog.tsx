"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Stakeholder, StakeholderRole } from "@/lib/types";

// Detail view with touchpoint history for a single stakeholder.

const roleConfig: Record<StakeholderRole, { label: string; className: string }> = {
  decision_maker: { label: "Decision Maker", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  champion: { label: "Champion", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  blocker: { label: "Blocker", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  influencer: { label: "Influencer", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  end_user: { label: "End User", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const touchpointIcons: Record<string, string> = {
  email: "📧",
  meeting: "📅",
  call: "📞",
  note: "📝",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface StakeholderDetailDialogProps {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeholderDetailDialog({ stakeholder, open, onOpenChange }: StakeholderDetailDialogProps) {
  if (!stakeholder) return null;

  const role = roleConfig[stakeholder.role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{stakeholder.name}</DialogTitle>
            <Badge variant="secondary" className={`${role.className} text-xs`}>
              {role.label}
            </Badge>
          </div>
          <DialogDescription>
            {stakeholder.job_title} · {stakeholder.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium mb-3">
              Interaction History ({stakeholder.touchpoints.length})
            </p>
            <div className="space-y-3">
              {stakeholder.touchpoints.map((tp) => (
                <div key={tp.id} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 mt-0.5">
                    {touchpointIcons[tp.type] ?? "📋"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p>{tp.summary}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tp.team_member_name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(tp.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {stakeholder.touchpoints.length === 0 && (
                <p className="text-sm text-muted-foreground">No interaction history yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
