"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLogEntryRow } from "@/components/dashboard/activity-log-entry";
import type { ActivityLogEntry } from "@/lib/types";

// Reusable activity log component. Shows a list of activity entries
// with an optional "Show more" button to reveal older entries.

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  title?: string;
  initialCount?: number;
  showMoreIncrement?: number;
}

export function ActivityLog({
  entries,
  title = "Recent Activity",
  initialCount = 8,
  showMoreIncrement = 8,
}: ActivityLogProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visible = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {visible.map((entry) => (
            <ActivityLogEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activity yet
          </p>
        )}
        {hasMore && (
          <div className="pt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleCount((c) => c + showMoreIncrement)}
            >
              Show more ({entries.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
