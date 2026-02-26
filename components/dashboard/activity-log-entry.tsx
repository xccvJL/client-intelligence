"use client";

import { Badge } from "@/components/ui/badge";
import type { ActivityLogEntry, ActivityEventType } from "@/lib/types";

// A single activity row with an icon representing the event type,
// a description, actor name, account name, and relative timestamp.

const eventConfig: Record<ActivityEventType, { icon: string; color: string; label: string }> = {
  account_created: { icon: "🏢", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", label: "Account" },
  account_archived: { icon: "📦", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Account" },
  account_restored: { icon: "♻️", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Account" },
  deal_created: { icon: "💰", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", label: "Deal" },
  deal_stage_changed: { icon: "➡️", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", label: "Deal" },
  deal_won: { icon: "🎉", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Deal" },
  deal_lost: { icon: "❌", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", label: "Deal" },
  task_created: { icon: "📋", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300", label: "Task" },
  task_completed: { icon: "✅", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Task" },
  task_reassigned: { icon: "🔄", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", label: "Task" },
  note_added: { icon: "📝", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300", label: "Note" },
  email_synced: { icon: "📧", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", label: "Email" },
  meeting_logged: { icon: "📅", color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", label: "Meeting" },
  health_changed: { icon: "💓", color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300", label: "Health" },
  contact_added: { icon: "👤", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300", label: "Contact" },
  workflow_applied: { icon: "⚡", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", label: "Workflow" },
  intelligence_received: { icon: "🧠", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", label: "Intel" },
  brief_updated: { icon: "📄", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", label: "Brief" },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityLogEntryRow({ entry }: { entry: ActivityLogEntry }) {
  const config = eventConfig[entry.event_type];

  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-base shrink-0 mt-0.5" role="img" aria-label={config.label}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{entry.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{entry.actor_name}</span>
          {entry.account_name && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{entry.account_name}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className={`${config.color} text-xs`}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(entry.created_at)}
        </span>
      </div>
    </div>
  );
}
