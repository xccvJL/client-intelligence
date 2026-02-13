"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task, TaskPriority, TeamRole } from "@/lib/types";

// A single task row with checkbox, title, priority badge, assignee, due date,
// source badges (Auto / Workflow), and role badge when assigned to a role.

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 hover:bg-red-100" },
};

const roleLabels: Record<TeamRole, string> = {
  sales: "Sales",
  onboarding: "Onboarding",
  account_manager: "Account Manager",
  specialist: "Specialist",
};

interface TaskCardProps {
  task: Task & { clients?: { name: string } | null };
  assigneeName?: string;
  workflowName?: string;
  onToggleStatus?: (taskId: string, done: boolean) => void;
}

export function TaskCard({ task, assigneeName, workflowName, onToggleStatus }: TaskCardProps) {
  const isDone = task.status === "done";
  const priority = priorityConfig[task.priority];

  const isOverdue =
    task.due_date && !isDone && new Date(task.due_date) < new Date();

  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  // Show the person's name if assigned, otherwise show the role badge
  const displayName = assigneeName
    ? assigneeName
    : task.assigned_role
      ? null // role badge will show instead
      : undefined;

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50">
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) =>
          onToggleStatus?.(task.id, checked === true)
        }
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5">
          {task.clients?.name && (
            <p className="text-xs text-muted-foreground">{task.clients.name}</p>
          )}
          {workflowName && (
            <span className="text-xs text-muted-foreground">
              {task.clients?.name ? " · " : ""}From: {workflowName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.source === "auto" && (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Auto
          </Badge>
        )}

        {task.source === "workflow" && (
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
            Workflow
          </Badge>
        )}

        <Badge variant="secondary" className={priority.className + " text-xs"}>
          {priority.label}
        </Badge>

        {task.assigned_role && !assigneeName && (
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
            {roleLabels[task.assigned_role]}
          </Badge>
        )}

        {displayName && (
          <span className="text-xs text-muted-foreground max-w-[80px] truncate">
            {displayName}
          </span>
        )}

        {dueDateLabel && (
          <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {dueDateLabel}
          </span>
        )}
      </div>
    </div>
  );
}
