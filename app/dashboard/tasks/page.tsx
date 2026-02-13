"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/dashboard/task-list";
import { TaskForm } from "@/components/dashboard/task-form";
import { TaskDetailDialog } from "@/components/dashboard/task-detail-dialog";
import { TaskFromTemplateDialog } from "@/components/dashboard/task-from-template-dialog";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Task, TaskStatus, Client, TeamMember, WorkflowStep } from "@/lib/types";

// My Tasks page — shows all tasks with status filter tabs.
// The "Add Task" button opens a dialog for creating new tasks.

const placeholderTeam: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", email: "sarah@thrive.com", role: "account_manager", gmail_watch_label: null, created_at: "" },
  { id: "tm2", name: "Mike Torres", email: "mike@thrive.com", role: "sales", gmail_watch_label: null, created_at: "" },
];

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "3", name: "Initech", domain: "initech.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

const placeholderTasks: (Task & { clients?: { name: string } | null })[] = [
  { id: "t1", client_id: "1", title: "Send updated SOW by Friday", description: null, status: "todo", priority: "high", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-14", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t2", client_id: "1", title: "Schedule follow-up with VP", description: null, status: "todo", priority: "medium", assignee_id: "tm2", assigned_role: null, due_date: "2026-02-18", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t3", client_id: "2", title: "Prepare quarterly budget review deck", description: "Include cost projections for Q3", status: "in_progress", priority: "high", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-15", intelligence_id: null, workflow_template_id: null, source: "manual", created_at: "2026-02-08", updated_at: "2026-02-08", clients: { name: "Globex Inc" } },
  { id: "t4", client_id: "1", title: "Review resource allocation", description: null, status: "done", priority: "medium", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-10", intelligence_id: "i2", workflow_template_id: null, source: "auto", created_at: "2026-02-07", updated_at: "2026-02-11", clients: { name: "Acme Corp" } },
  { id: "t5", client_id: "3", title: "Send onboarding checklist to new point of contact", description: null, status: "todo", priority: "low", assignee_id: null, assigned_role: "onboarding", due_date: null, intelligence_id: null, workflow_template_id: null, source: "manual", created_at: "2026-02-06", updated_at: "2026-02-06", clients: { name: "Initech" } },
];

export default function TasksPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [tasks, setTasks] = useState(placeholderTasks);
  const [detailTask, setDetailTask] = useState<(Task & { clients?: { name: string } | null }) | null>(null);
  const [editingTask, setEditingTask] = useState<(Task & { clients?: { name: string } | null }) | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<WorkflowStep | null>(null);

  const { workflowTemplates } = useTeamContext();
  const memberMap = new Map(placeholderTeam.map((m) => [m.id, m.name]));

  function handleToggleStatus(taskId: string, done: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: (done ? "done" : "todo") as TaskStatus } : t
      )
    );
  }

  function filterByStatus(status: TaskStatus | "all") {
    if (status === "all") return tasks;
    return tasks.filter((t) => t.status === status);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            Track action items across all clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            From Template
          </Button>
          <Button onClick={() => setFormOpen(true)}>Add Task</Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="todo">
            To Do ({filterByStatus("todo").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({filterByStatus("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="done">
            Done ({filterByStatus("done").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <TaskList
            tasks={tasks}
            teamMembers={placeholderTeam}
            onToggleStatus={handleToggleStatus}
            onTaskClick={(task) => setDetailTask(task)}
          />
        </TabsContent>

        <TabsContent value="todo" className="mt-4">
          <TaskList
            tasks={filterByStatus("todo")}
            teamMembers={placeholderTeam}
            onToggleStatus={handleToggleStatus}
            onTaskClick={(task) => setDetailTask(task)}
            emptyMessage="No to-do tasks"
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-4">
          <TaskList
            tasks={filterByStatus("in_progress")}
            teamMembers={placeholderTeam}
            onToggleStatus={handleToggleStatus}
            onTaskClick={(task) => setDetailTask(task)}
            emptyMessage="No in-progress tasks"
          />
        </TabsContent>

        <TabsContent value="done" className="mt-4">
          <TaskList
            tasks={filterByStatus("done")}
            teamMembers={placeholderTeam}
            onToggleStatus={handleToggleStatus}
            onTaskClick={(task) => setDetailTask(task)}
            emptyMessage="No completed tasks"
          />
        </TabsContent>
      </Tabs>

      <TaskForm
        open={formOpen && !templateDefaults}
        onOpenChange={setFormOpen}
        clients={placeholderClients}
        teamMembers={placeholderTeam}
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
            clients: placeholderClients.find((c) => c.id === task.client_id)
              ? { name: placeholderClients.find((c) => c.id === task.client_id)!.name }
              : null,
          };
          setTasks((prev) => [newTask, ...prev]);
        }}
      />

      {detailTask && (
        <TaskDetailDialog
          open={!!detailTask}
          onOpenChange={(open) => { if (!open) setDetailTask(null); }}
          task={detailTask}
          assigneeName={detailTask.assignee_id ? memberMap.get(detailTask.assignee_id) : undefined}
          onEdit={() => {
            setEditingTask(detailTask);
            setDetailTask(null);
          }}
        />
      )}

      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        clients={placeholderClients}
        teamMembers={placeholderTeam}
        task={editingTask}
        onSubmit={(updated) => {
          if (editingTask) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === editingTask.id
                  ? {
                      ...t,
                      ...updated,
                      assigned_role: updated.assigned_role ?? null,
                      updated_at: new Date().toISOString(),
                      clients: placeholderClients.find((c) => c.id === updated.client_id)
                        ? { name: placeholderClients.find((c) => c.id === updated.client_id)!.name }
                        : t.clients,
                    }
                  : t
              )
            );
          }
          setEditingTask(null);
        }}
      />

      <TaskFromTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={workflowTemplates}
        onSelect={(step) => {
          setTemplateDefaults(step);
          setFormOpen(true);
        }}
      />

      {templateDefaults && (
        <TaskForm
          open={formOpen && !!templateDefaults}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setTemplateDefaults(null);
          }}
          clients={placeholderClients}
          teamMembers={placeholderTeam}
          defaults={{
            title: templateDefaults.title,
            description: templateDefaults.description ?? undefined,
            priority: templateDefaults.priority,
            assigned_role: templateDefaults.assigned_role,
          }}
          onSubmit={(task) => {
            const newTask: Task & { clients?: { name: string } | null } = {
              id: `t${Date.now()}`,
              ...task,
              assigned_role: task.assigned_role ?? null,
              status: "todo",
              intelligence_id: null,
              workflow_template_id: null,
              source: "workflow",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              clients: placeholderClients.find((c) => c.id === task.client_id)
                ? { name: placeholderClients.find((c) => c.id === task.client_id)!.name }
                : null,
            };
            setTasks((prev) => [newTask, ...prev]);
            setTemplateDefaults(null);
          }}
        />
      )}
    </div>
  );
}
