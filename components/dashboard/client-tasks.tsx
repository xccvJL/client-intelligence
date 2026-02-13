"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskFromTemplateDialog } from "./task-from-template-dialog";
import { WorkflowTemplateForm } from "./workflow-template-form";
import { useTeamContext } from "./team-context";
import type { Task, TaskStatus, Client, TeamMember, WorkflowStep } from "@/lib/types";

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
  const [detailTask, setDetailTask] = useState<(Task & { clients?: { name: string } | null }) | null>(null);
  const [editingTask, setEditingTask] = useState<(Task & { clients?: { name: string } | null }) | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<WorkflowStep | null>(null);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  const { workflowTemplates, setWorkflowTemplates } = useTeamContext();
  const memberMap = new Map(placeholderTeam.map((m) => [m.id, m.name]));

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
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setSaveAsTemplateOpen(true)}>
              Save as Template
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            From Template
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            Add Task
          </Button>
        </div>
      </div>

      <TaskList
        tasks={tasks}
        teamMembers={placeholderTeam}
        onToggleStatus={handleToggleStatus}
        onTaskClick={(task) => setDetailTask(task)}
        emptyMessage="No tasks for this account yet"
      />

      <TaskForm
        open={formOpen && !templateDefaults}
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
        defaultClientId={clientId}
        task={editingTask}
        onSubmit={(updated) => {
          if (editingTask) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === editingTask.id
                  ? { ...t, ...updated, assigned_role: updated.assigned_role ?? null, updated_at: new Date().toISOString() }
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

      {/* Pre-fill the "Add Task" form when a template step was selected */}
      {templateDefaults && (
        <TaskForm
          open={formOpen && !!templateDefaults}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setTemplateDefaults(null);
          }}
          clients={placeholderClients}
          teamMembers={placeholderTeam}
          defaultClientId={clientId}
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
              clients: null,
            };
            setTasks((prev) => [newTask, ...prev]);
            setTemplateDefaults(null);
          }}
        />
      )}

      <WorkflowTemplateForm
        open={saveAsTemplateOpen}
        onOpenChange={setSaveAsTemplateOpen}
        template={{
          id: "",
          name: "",
          description: null,
          steps: tasks
            .filter((t) => t.status !== "done")
            .map((t, i) => ({
              title: t.title,
              description: t.description,
              assigned_role: t.assigned_role ?? "onboarding",
              priority: t.priority,
              due_in_days: 0,
              order: i + 1,
            })),
          created_at: "",
          updated_at: "",
        }}
        onSubmit={(data) => {
          const newTemplate = {
            id: `wf-${Date.now()}`,
            name: data.name,
            description: data.description || null,
            steps: data.steps,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setWorkflowTemplates((prev) => [newTemplate, ...prev]);
        }}
      />
    </div>
  );
}
