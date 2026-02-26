"use client";

import { Badge } from "@/components/ui/badge";
import type { TimelineEvent, TimelineEventType, Sentiment } from "@/lib/types";

// Single timeline event row with colored left border (green/yellow/red by sentiment),
// icon, timestamp, and description.

const typeConfig: Record<TimelineEventType, { icon: string; label: string }> = {
  email: { icon: "📧", label: "Email" },
  deal_change: { icon: "💰", label: "Deal" },
  task_completed: { icon: "✅", label: "Task" },
  health_change: { icon: "💓", label: "Health" },
  note: { icon: "📝", label: "Note" },
  meeting: { icon: "📅", label: "Meeting" },
  intelligence: { icon: "🧠", label: "Intel" },
  contact_added: { icon: "👤", label: "Contact" },
  workflow: { icon: "⚡", label: "Workflow" },
};

const sentimentBorderColors: Record<Sentiment, string> = {
  positive: "border-l-green-500",
  neutral: "border-l-gray-300 dark:border-l-gray-600",
  negative: "border-l-red-500",
  mixed: "border-l-yellow-500",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const config = typeConfig[event.type];
  const borderColor = event.sentiment
    ? sentimentBorderColors[event.sentiment]
    : "border-l-gray-200 dark:border-l-gray-700";

  return (
    <div className={`rounded-md border border-l-4 ${borderColor} p-3`}>
      <div className="flex items-start gap-3">
        <span className="text-base shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{event.title}</p>
            <Badge variant="outline" className="text-xs">{config.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {event.actor_name && (
              <span className="text-xs text-muted-foreground">{event.actor_name}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(event.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
