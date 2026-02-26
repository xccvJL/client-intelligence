"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/dashboard/task-list";
import { TaskForm } from "@/components/dashboard/task-form";
import { TaskDetailDialog } from "@/components/dashboard/task-detail-dialog";
import { TaskFromTemplateDialog } from "@/components/dashboard/task-from-template-dialog";
import { BulkActionBar } from "@/components/dashboard/bulk-action-bar";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Task, TaskStatus, Client, WorkflowStep } from "@/lib/types";

type TaskWithClient = Task & { clients?: { name: string } | null };

export default function TasksPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<TaskWithClient | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithClient | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<WorkflowStep | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { workflowTemplates, teamMembers, getRequestHeaders } = useTeamContext();
  const memberMap = useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member.name])),
    [teamMembers]
  );
  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const [tasksRes, clientsRes] = await Promise.all([
          fetch("/api/tasks", { headers: getRequestHeaders() }),
          fetch("/api/clients", { headers: getRequestHeaders() }),
        ]);

        const tasksJson = (await tasksRes.json()) as { data?: TaskWithClient[]; error?: string };
        const clientsJson = (await clientsRes.json()) as { data?: Client[]; error?: string };

        if (!tasksRes.ok) {
          throw new Error(tasksJson.error ?? "Failed to load tasks");
        }
        if (!clientsRes.ok) {
          throw new Error(clientsJson.error ?? "Failed to load clients");
        }

        setTasks(tasksJson.data ?? []);
        setClients(clientsJson.data ?? []);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [getRequestHeaders]);

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

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(json.error ?? "Failed to delete task");
    }
  }

  async function handleToggleStatus(taskId: string, done: boolean) {
    setPageError(null);
    const previous = tasks;
    const nextStatus: TaskStatus = done ? "done" : "todo";

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )
    );

    try {
      const updated = await patchTask(taskId, { status: nextStatus });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updated,
                clients: task.clients ?? (updated.client_id ? { name: clientNameById.get(updated.client_id) ?? "Unknown" } : null),
              }
            : task
        )
      );
    } catch (error) {
      setTasks(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update task");
    }
  }

  function filterByStatus(status: TaskStatus | "all") {
    if (status === "all") return tasks;
    return tasks.filter((task) => task.status === status);
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
      clients: { name: clientNameById.get(task.client_id) ?? "Unknown" },
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
          source,
        }),
      });
      const json = (await res.json()) as { data?: Task; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to create task");
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === optimisticId
            ? {
                ...json.data!,
                clients: {
                  name:
                    clientNameById.get(json.data!.client_id) ??
                    optimisticTask.clients?.name ??
                    "Unknown",
                },
              }
            : item
        )
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
              clients: { name: clientNameById.get(updates.client_id) ?? "Unknown" },
            }
          : task
      )
    );

    try {
      const updated = await patchTask(taskId, updates);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updated,
                clients: { name: clientNameById.get(updated.client_id) ?? "Unknown" },
              }
            : task
        )
      );
    } catch (error) {
      setTasks(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update task");
    }
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
          <Button
            variant={selectedIds.size > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className={selectedIds.size > 0 ? "" : "hidden sm:inline-flex"}
          >
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select"}
          </Button>
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            From Template
          </Button>
          <Button onClick={() => setFormOpen(true)}>Add Task</Button>
        </div>
      </div>

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : (
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
              teamMembers={teamMembers}
              onToggleStatus={handleToggleStatus}
              onTaskClick={(task) => setDetailTask(task)}
              selectable
              selectedIds={selectedIds}
              onSelectChange={(id, selected) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (selected) next.add(id);
                  else next.delete(id);
                  return next;
                })
              }
            />
          </TabsContent>

          <TabsContent value="todo" className="mt-4">
            <TaskList
              tasks={filterByStatus("todo")}
              teamMembers={teamMembers}
              onToggleStatus={handleToggleStatus}
              onTaskClick={(task) => setDetailTask(task)}
              selectable
              selectedIds={selectedIds}
              onSelectChange={(id, selected) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (selected) next.add(id);
                  else next.delete(id);
                  return next;
                })
              }
              emptyMessage="No to-do tasks"
            />
          </TabsContent>

          <TabsContent value="in_progress" className="mt-4">
            <TaskList
              tasks={filterByStatus("in_progress")}
              teamMembers={teamMembers}
              onToggleStatus={handleToggleStatus}
              onTaskClick={(task) => setDetailTask(task)}
              selectable
              selectedIds={selectedIds}
              onSelectChange={(id, selected) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (selected) next.add(id);
                  else next.delete(id);
                  return next;
                })
              }
              emptyMessage="No in-progress tasks"
            />
          </TabsContent>

          <TabsContent value="done" className="mt-4">
            <TaskList
              tasks={filterByStatus("done")}
              teamMembers={teamMembers}
              onToggleStatus={handleToggleStatus}
              onTaskClick={(task) => setDetailTask(task)}
              selectable
              selectedIds={selectedIds}
              onSelectChange={(id, selected) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (selected) next.add(id);
                  else next.delete(id);
                  return next;
                })
              }
              emptyMessage="No completed tasks"
            />
          </TabsContent>
        </Tabs>
      )}

      <TaskForm
        open={formOpen && !templateDefaults}
        onOpenChange={setFormOpen}
        clients={clients}
        teamMembers={teamMembers}
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
        clients={clients}
        teamMembers={teamMembers}
        task={editingTask}
        onSubmit={(updated) => {
          if (editingTask) {
            void updateTask(editingTask.id, updated);
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
          clients={clients}
          teamMembers={teamMembers}
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

      <BulkActionBar
        selectedCount={selectedIds.size}
        onMarkDone={() => {
          void (async () => {
            setPageError(null);
            const previous = tasks;
            const ids = new Set(selectedIds);
            setTasks((prev) =>
              prev.map((task) => (ids.has(task.id) ? { ...task, status: "done" as TaskStatus } : task))
            );
            setSelectedIds(new Set());

            try {
              await Promise.all(Array.from(ids).map((id) => patchTask(id, { status: "done" })));
            } catch (error) {
              setTasks(previous);
              setPageError(error instanceof Error ? error.message : "Failed to update selected tasks");
            }
          })();
        }}
        onDelete={() => {
          void (async () => {
            setPageError(null);
            const previous = tasks;
            const ids = new Set(selectedIds);
            setTasks((prev) => prev.filter((task) => !ids.has(task.id)));
            setSelectedIds(new Set());

            try {
              await Promise.all(Array.from(ids).map((id) => deleteTask(id)));
            } catch (error) {
              setTasks(previous);
              setPageError(error instanceof Error ? error.message : "Failed to delete selected tasks");
            }
          })();
        }}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
