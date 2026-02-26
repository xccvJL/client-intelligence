"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, TeamMember, Task, TaskPriority, TeamRole } from "@/lib/types";

// Dialog form for creating a new task.
// Has fields for title, description, priority, assigned role, assignee, due date, and client.

interface TaskDefaults {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigned_role?: TeamRole | null;
  assignee_id?: string;
  due_date?: string;
  client_id?: string;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  teamMembers: TeamMember[];
  defaultClientId?: string;
  task?: (Task & { clients?: { name: string } | null }) | null;
  defaults?: TaskDefaults | null;
  onSubmit: (task: {
    client_id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assignee_id: string;
    assigned_role: TeamRole | null;
    due_date: string;
  }) => void;
}

export function TaskForm({
  open,
  onOpenChange,
  clients,
  teamMembers,
  defaultClientId,
  task,
  defaults,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState(() => task?.title ?? defaults?.title ?? "");
  const [description, setDescription] = useState(
    () => task?.description ?? defaults?.description ?? ""
  );
  const [priority, setPriority] = useState<TaskPriority>(
    () => task?.priority ?? defaults?.priority ?? "medium"
  );
  const [assignedRole, setAssignedRole] = useState<TeamRole | "">(
    () => task?.assigned_role ?? defaults?.assigned_role ?? ""
  );
  const [assigneeId, setAssigneeId] = useState(() => task?.assignee_id ?? defaults?.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(() => task?.due_date ?? defaults?.due_date ?? "");
  const [clientId, setClientId] = useState(
    () => task?.client_id ?? defaults?.client_id ?? defaultClientId ?? ""
  );

  const isEditing = !!task;
  const defaultsKey = defaults
    ? `${defaults.title ?? ""}:${defaults.client_id ?? ""}:${defaults.assigned_role ?? ""}:${defaults.priority ?? ""}:${defaults.due_date ?? ""}`
    : "no-defaults";
  const formKey = `${open ? "open" : "closed"}:${task?.id ?? "new"}:${defaultClientId ?? ""}:${defaultsKey}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    onSubmit({
      client_id: clientId,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee_id: assigneeId,
      assigned_role: assignedRole ? (assignedRole as TeamRole) : null,
      due_date: dueDate,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={formKey} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more detail (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {!defaultClientId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Role</label>
              <Select value={assignedRole} onValueChange={(v) => setAssignedRole(v as TeamRole | "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="account_manager">Account Manager</SelectItem>
                  <SelectItem value="specialist">Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !clientId}>
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
