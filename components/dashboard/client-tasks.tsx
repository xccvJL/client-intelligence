"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskFromTemplateDialog } from "./task-from-template-dialog";
import { WorkflowTemplateForm } from "./workflow-template-form";
import { useTeamContext } from "./team-context";
import type { Task, TaskStatus, Client, WorkflowStep, WorkflowTemplate } from "@/lib/types";

// Shows tasks for a specific client inside the client detail page.

interface ClientTasksProps {
  clientId: string;
}

type TaskWithClient = Task & { clients?: { name: string } | null };

export function ClientTasks({ clientId }: ClientTasksProps) {
  const {
    workflowTemplates,
    setWorkflowTemplates,
    teamMembers,
    getRequestHeaders,
  } = useTeamContext();

  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskWithClient | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithClient | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<WorkflowStep | null>(null);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  const formClients = useMemo(() => (client ? [client] : []), [client]);
  const memberMap = useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member.name])),
    [teamMembers]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);

      try {
        const [tasksRes, clientRes] = await Promise.all([
          fetch(`/api/tasks?client_id=${clientId}`, { headers: getRequestHeaders() }),
          fetch(`/api/clients/${clientId}`, { headers: getRequestHeaders() }),
        ]);

        const tasksJson = (await tasksRes.json()) as { data?: TaskWithClient[]; error?: string };
        const clientJson = (await clientRes.json()) as { data?: Client; error?: string };

        if (!tasksRes.ok) {
          throw new Error(tasksJson.error ?? "Failed to load tasks");
        }
        if (!clientRes.ok) {
          throw new Error(clientJson.error ?? "Failed to load account details");
        }

        setTasks(tasksJson.data ?? []);
        setClient(clientJson.data ?? null);
      } catch (error) {
        setTasks([]);
        setClient(null);
        setPageError(error instanceof Error ? error.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [clientId, getRequestHeaders]);

  async function patchTask(taskId: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getRequestHeaders(),
      },
      body: JSON.stringify(updates),
    });

    const json = (await res.json()) as { data?: Task; error?: string };
    if (!res.ok || !json.data) {
      throw new Error(json.error ?? "Failed to update task");
    }

    return json.data;
  }

  function withClientName(task: Task): TaskWithClient {
    return {
      ...task,
      clients: {
        name: client?.name ?? "Unknown",
      },
    };
  }

  function handleToggleStatus(taskId: string, done: boolean) {
    setPageError(null);
    const previous = tasks;
    const nextStatus: TaskStatus = done ? "done" : "todo";

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )
    );

    void (async () => {
      try {
        const updated = await patchTask(taskId, { status: nextStatus });
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updated,
                  clients: task.clients ?? { name: client?.name ?? "Unknown" },
                }
              : task
          )
        );
      } catch (error) {
        setTasks(previous);
        setPageError(error instanceof Error ? error.message : "Failed to update task");
      }
    })();
  }

  async function createTask(
    task: {
      client_id: string;
      title: string;
      description: string;
      priority: Task["priority"];
      assignee_id: string;
      assigned_role: Task["assigned_role"];
      due_date: string;
    },
    source: Task["source"] = "manual"
  ) {
    setPageError(null);

    const optimisticId = `task-optimistic-${Date.now()}`;
    const optimisticTask: TaskWithClient = {
      id: optimisticId,
      client_id: task.client_id,
      title: task.title,
      description: task.description || null,
      status: "todo",
      priority: task.priority,
      assignee_id: task.assignee_id || null,
      assigned_role: task.assigned_role ?? null,
      due_date: task.due_date || null,
      intelligence_id: null,
      workflow_template_id: null,
      source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: { name: client?.name ?? "Unknown" },
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({
          ...task,
          description: task.description || null,
          assignee_id: task.assignee_id || null,
          due_date: task.due_date || null,
          source,
        }),
      });

      const json = (await res.json()) as { data?: Task; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to create task");
      }

      setTasks((prev) =>
        prev.map((item) => (item.id === optimisticId ? withClientName(json.data!) : item))
      );
    } catch (error) {
      setTasks((prev) => prev.filter((item) => item.id !== optimisticId));
      setPageError(error instanceof Error ? error.message : "Failed to create task");
    }
  }

  async function updateTask(
    taskId: string,
    updates: {
      client_id: string;
      title: string;
      description: string;
      priority: Task["priority"];
      assignee_id: string;
      assigned_role: Task["assigned_role"];
      due_date: string;
    }
  ) {
    setPageError(null);
    const previous = tasks;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              description: updates.description || null,
              assignee_id: updates.assignee_id || null,
              assigned_role: updates.assigned_role ?? null,
              due_date: updates.due_date || null,
              clients: task.clients ?? { name: client?.name ?? "Unknown" },
            }
          : task
      )
    );

    try {
      const updated = await patchTask(taskId, {
        client_id: updates.client_id,
        title: updates.title,
        description: updates.description || null,
        priority: updates.priority,
        assignee_id: updates.assignee_id || null,
        assigned_role: updates.assigned_role ?? null,
        due_date: updates.due_date || null,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updated,
                clients: task.clients ?? { name: client?.name ?? "Unknown" },
              }
            : task
        )
      );
    } catch (error) {
      setTasks(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update task");
    }
  }

  function handleSaveAsTemplate(data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) {
    setPageError(null);

    const optimisticId = `workflow-optimistic-${Date.now()}`;
    const optimisticTemplate: WorkflowTemplate = {
      id: optimisticId,
      name: data.name,
      description: data.description || null,
      steps: data.steps,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setWorkflowTemplates((prev) => [optimisticTemplate, ...prev]);

    void (async () => {
      try {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getRequestHeaders(),
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || null,
            steps: data.steps,
          }),
        });

        const json = (await res.json()) as { data?: WorkflowTemplate; error?: string };
        if (!res.ok || !json.data) {
          throw new Error(json.error ?? "Failed to save workflow template");
        }

        setWorkflowTemplates((prev) =>
          prev.map((template) =>
            template.id === optimisticId ? json.data! : template
          )
        );
      } catch (error) {
        setWorkflowTemplates((prev) =>
          prev.filter((template) => template.id !== optimisticId)
        );
        setPageError(
          error instanceof Error ? error.message : "Failed to save workflow template"
        );
      }
    })();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading tasks...</p>;
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

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      <TaskList
        tasks={tasks}
        teamMembers={teamMembers}
        onToggleStatus={handleToggleStatus}
        onTaskClick={(task) => setDetailTask(task)}
        emptyMessage="No tasks for this account yet"
      />

      <TaskForm
        open={formOpen && !templateDefaults}
        onOpenChange={setFormOpen}
        clients={formClients}
        teamMembers={teamMembers}
        defaultClientId={clientId}
        onSubmit={(task) => {
          void createTask(task, "manual");
        }}
      />

      {detailTask && (
        <TaskDetailDialog
          open={!!detailTask}
          onOpenChange={(open) => {
            if (!open) setDetailTask(null);
          }}
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
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        clients={formClients}
        teamMembers={teamMembers}
        defaultClientId={clientId}
        task={editingTask}
        onSubmit={(updatedTask) => {
          if (!editingTask) return;
          void updateTask(editingTask.id, updatedTask);
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
          clients={formClients}
          teamMembers={teamMembers}
          defaultClientId={clientId}
          defaults={{
            title: templateDefaults.title,
            description: templateDefaults.description ?? undefined,
            priority: templateDefaults.priority,
            assigned_role: templateDefaults.assigned_role,
          }}
          onSubmit={(task) => {
            void createTask(task, "workflow");
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
            .filter((task) => task.status !== "done")
            .map((task, index) => ({
              title: task.title,
              description: task.description,
              assigned_role: task.assigned_role ?? "onboarding",
              priority: task.priority,
              due_in_days: 0,
              order: index + 1,
            })),
          created_at: "",
          updated_at: "",
        }}
        onSubmit={handleSaveAsTemplate}
      />
    </div>
  );
}
