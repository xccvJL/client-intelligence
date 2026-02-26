"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TimelineEventCard } from "@/components/dashboard/timeline-event-card";
import { timelinesByAccount } from "@/lib/mock-timeline";
import type { TimelineEventType } from "@/lib/types";

// Main timeline component with type filters and "load more" pagination.
// Shows a unified chronological view of all events for an account.

const filterOptions: { type: TimelineEventType | "all"; label: string }[] = [
  { type: "all", label: "All" },
  { type: "email", label: "Emails" },
  { type: "meeting", label: "Meetings" },
  { type: "deal_change", label: "Deals" },
  { type: "task_completed", label: "Tasks" },
  { type: "health_change", label: "Health" },
  { type: "note", label: "Notes" },
  { type: "intelligence", label: "Intel" },
];

interface ClientTimelineProps {
  clientId: string;
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");
  const [visibleCount, setVisibleCount] = useState(10);

  const allEvents = timelinesByAccount[clientId] ?? [];
  const filtered = filter === "all"
    ? allEvents
    : allEvents.filter((e) => e.type === filter);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-4">
      {/* Type filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <Button
            key={opt.type}
            variant={filter === opt.type ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(opt.type);
              setVisibleCount(10);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Timeline events */}
      <div className="space-y-3">
        {visible.map((event) => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No {filter !== "all" ? filter.replace("_", " ") : ""} events for this account
        </p>
      )}

      {hasMore && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((c) => c + 10)}
          >
            Load more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
