"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stakeholder, StakeholderRole } from "@/lib/types";

// Card showing a stakeholder's name, role badge (color-coded), job title,
// and last interaction date.

const roleConfig: Record<StakeholderRole, { label: string; className: string }> = {
  decision_maker: { label: "Decision Maker", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  champion: { label: "Champion", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  blocker: { label: "Blocker", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  influencer: { label: "Influencer", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  end_user: { label: "End User", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface StakeholderCardProps {
  stakeholder: Stakeholder;
  onClick?: () => void;
}

export function StakeholderCard({ stakeholder, onClick }: StakeholderCardProps) {
  const role = roleConfig[stakeholder.role];

  return (
    <Card
      className={`transition-shadow ${onClick ? "hover:shadow-md cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{stakeholder.name}</CardTitle>
          <Badge variant="secondary" className={`${role.className} text-xs`}>
            {role.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{stakeholder.job_title}</p>
        <p className="text-xs text-muted-foreground mt-1">{stakeholder.email}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {stakeholder.touchpoints.length} touchpoint{stakeholder.touchpoints.length !== 1 ? "s" : ""}
          </span>
          {stakeholder.last_interaction_date && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                Last: {formatDate(stakeholder.last_interaction_date)}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
