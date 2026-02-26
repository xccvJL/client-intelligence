"use client";

import { TaskCard } from "./task-card";
import type { Task, TeamMember } from "@/lib/types";

// Reusable filtered task list — used on both the tasks page
// and the client detail page. Groups overdue tasks at the top.
// Supports optional bulk selection mode.

interface TaskListProps {
  tasks: (Task & { clients?: { name: string } | null })[];
  teamMembers: TeamMember[];
  onToggleStatus?: (taskId: string, done: boolean) => void;
  onTaskClick?: (task: Task & { clients?: { name: string } | null }) => void;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectChange?: (taskId: string, selected: boolean) => void;
}

export function TaskList({
  tasks,
  teamMembers,
  onToggleStatus,
  onTaskClick,
  emptyMessage = "No tasks yet",
  selectable,
  selectedIds,
  onSelectChange,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {emptyMessage}
      </p>
    );
  }

  // Build a lookup map so we can quickly resolve assignee IDs to names
  const memberMap = new Map(teamMembers.map((m) => [m.id, m.name]));

  // Separate overdue tasks so they appear at the top for visibility
  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.due_date && t.status !== "done" && new Date(t.due_date) < now
  );
  const rest = tasks.filter(
    (t) => !overdue.includes(t)
  );

  return (
    <div className="space-y-1.5">
      {overdue.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-red-600 mb-1.5">
            Overdue ({overdue.length})
          </p>
          <div className="space-y-1.5">
            {overdue.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={task.assignee_id ? memberMap.get(task.assignee_id) : undefined}
                onToggleStatus={onToggleStatus}
                onClick={onTaskClick}
                selectable={selectable}
                selected={selectedIds?.has(task.id)}
                onSelectChange={onSelectChange}
              />
            ))}
          </div>
        </div>
      )}

      {rest.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          assigneeName={task.assignee_id ? memberMap.get(task.assignee_id) : undefined}
          onToggleStatus={onToggleStatus}
          onClick={onTaskClick}
          selectable={selectable}
          selected={selectedIds?.has(task.id)}
          onSelectChange={onSelectChange}
        />
      ))}
    </div>
  );
}
