"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form";
import type { Task, TaskStatus, Client, TeamMember } from "@/lib/types";

// Shows the tasks for a specific client inside the client detail page.
// Includes inline status toggles and an "Add Task" button.

interface ClientTasksProps {
  clientId: string;
}

const placeholderTeam: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", email: "sarah@thrive.com", role: "account_manager", gmail_watch_label: null, created_at: "" },
  { id: "tm2", name: "Mike Torres", email: "mike@thrive.com", role: "sales", gmail_watch_label: null, created_at: "" },
];

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

const placeholderTasks: (Task & { clients?: { name: string } | null })[] = [
  { id: "t1", client_id: "1", title: "Send updated SOW by Friday", description: null, status: "todo", priority: "high", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-14", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t2", client_id: "1", title: "Schedule follow-up with VP", description: null, status: "todo", priority: "medium", assignee_id: "tm2", assigned_role: null, due_date: "2026-02-18", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t4", client_id: "1", title: "Review resource allocation", description: null, status: "done", priority: "medium", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-10", intelligence_id: "i2", workflow_template_id: null, source: "auto", created_at: "2026-02-07", updated_at: "2026-02-11", clients: { name: "Acme Corp" } },
];

export function ClientTasks({ clientId }: ClientTasksProps) {
  const [tasks, setTasks] = useState(placeholderTasks);
  const [formOpen, setFormOpen] = useState(false);

  function handleToggleStatus(taskId: string, done: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: (done ? "done" : "todo") as TaskStatus } : t
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          Add Task
        </Button>
      </div>

      <TaskList
        tasks={tasks}
        teamMembers={placeholderTeam}
        onToggleStatus={handleToggleStatus}
        emptyMessage="No tasks for this account yet"
      />

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={placeholderClients}
        teamMembers={placeholderTeam}
        defaultClientId={clientId}
        onSubmit={(task) => {
          const newTask: Task & { clients?: { name: string } | null } = {
            id: `t${Date.now()}`,
            ...task,
            assigned_role: task.assigned_role ?? null,
            status: "todo",
            intelligence_id: null,
            workflow_template_id: null,
            source: "manual",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            clients: null,
          };
          setTasks((prev) => [newTask, ...prev]);
        }}
      />
    </div>
  );
}
