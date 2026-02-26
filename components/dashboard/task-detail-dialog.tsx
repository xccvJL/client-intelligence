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
import type { Task, TaskPriority, TeamRole } from "@/lib/types";

// Read-only dialog showing all task fields with an "Edit" button.

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const roleLabels: Record<TeamRole, string> = {
  sales: "Sales",
  onboarding: "Onboarding",
  account_manager: "Account Manager",
  specialist: "Specialist",
};

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  auto: "Auto (AI)",
  workflow: "Workflow",
};

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task & { clients?: { name: string } | null };
  assigneeName?: string;
  onEdit: () => void;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  assigneeName,
  onEdit,
}: TaskDetailDialogProps) {
  const priority = priorityConfig[task.priority];
  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-snug">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
              <p className="text-sm">{statusLabels[task.status] ?? task.status}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
              <Badge variant="secondary" className={priority.className + " text-xs"}>
                {priority.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Assignee</p>
              <p className="text-sm">{assigneeName ?? "Unassigned"}</p>
            </div>
            {task.assigned_role && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Role</p>
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                  {roleLabels[task.assigned_role]}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {dueDateLabel && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Due Date</p>
                <p className="text-sm">{dueDateLabel}</p>
              </div>
            )}
            {task.clients?.name && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Account</p>
                <p className="text-sm">{task.clients.name}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Source</p>
            <p className="text-sm">{sourceLabels[task.source] ?? task.source}</p>
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
