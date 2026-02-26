"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowCard } from "@/components/dashboard/workflow-card";
import { WorkflowTemplateForm } from "@/components/dashboard/workflow-template-form";
import { ApplyWorkflowDialog } from "@/components/dashboard/apply-workflow-dialog";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { WorkflowTemplate, WorkflowStep, Client } from "@/lib/types";

export default function WorkflowsPage() {
  const {
    workflowTemplates: templates,
    setWorkflowTemplates: setTemplates,
    getRequestHeaders,
  } = useTeamContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    async function loadClients() {
      setLoading(true);
      setPageError(null);
      try {
        const res = await fetch("/api/clients?status=active", {
          headers: getRequestHeaders(),
        });
        const json = (await res.json()) as { data?: Client[]; error?: string };
        if (!res.ok) {
          setPageError(json.error ?? "Failed to load workflow data");
          return;
        }
        setClients(json.data ?? []);
      } catch {
        setPageError("Failed to load workflow data");
      } finally {
        setLoading(false);
      }
    }

    void loadClients();
  }, [getRequestHeaders]);

  async function handleCreateTemplate(data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) {
    setPageError(null);
    const optimisticId = `wf-optimistic-${Date.now()}`;
    const optimisticTemplate: WorkflowTemplate = {
      id: optimisticId,
      name: data.name,
      description: data.description || null,
      steps: data.steps,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTemplates((prev) => [optimisticTemplate, ...prev]);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { data?: WorkflowTemplate; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to create workflow");
      }

      setTemplates((prev) =>
        prev.map((template) =>
          template.id === optimisticId ? json.data! : template
        )
      );
    } catch (error) {
      setTemplates((prev) => prev.filter((template) => template.id !== optimisticId));
      setPageError(error instanceof Error ? error.message : "Failed to create workflow");
    }
  }

  async function handleEditTemplate(data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) {
    if (!editingTemplate) return;
    setPageError(null);

    const previous = templates;
    const optimisticUpdated: WorkflowTemplate = {
      ...editingTemplate,
      name: data.name,
      description: data.description || null,
      steps: data.steps,
      updated_at: new Date().toISOString(),
    };
    setTemplates((prev) =>
      prev.map((template) => (template.id === editingTemplate.id ? optimisticUpdated : template))
    );
    setEditingTemplate(null);

    try {
      const res = await fetch(`/api/workflows/${editingTemplate.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { data?: WorkflowTemplate; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to update workflow");
      }

      setTemplates((prev) =>
        prev.map((template) =>
          template.id === editingTemplate.id ? json.data! : template
        )
      );
    } catch (error) {
      setTemplates(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update workflow");
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    setPageError(null);
    const previous = templates;
    setTemplates((prev) => prev.filter((template) => template.id !== templateId));

    try {
      const res = await fetch(`/api/workflows/${templateId}`, {
        method: "DELETE",
        headers: getRequestHeaders(),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to delete workflow");
      }
    } catch (error) {
      setTemplates(previous);
      setPageError(error instanceof Error ? error.message : "Failed to delete workflow");
    }
  }

  function handleApplyClick(template: WorkflowTemplate) {
    setApplyingTemplate(template);
    setApplyDialogOpen(true);
  }

  async function handleApply(templateId: string, clientId: string) {
    const res = await fetch(`/api/workflows/${templateId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRequestHeaders(),
      },
      body: JSON.stringify({ client_id: clientId }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Failed to apply workflow");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Reusable multi-step processes you can apply to any client
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>Add Workflow</Button>
      </div>

      {pageError && (
        <p className="text-sm text-destructive">{pageError}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading workflows...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No workflow templates yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <WorkflowCard
              key={template.id}
              template={template}
              onApply={handleApplyClick}
              onEdit={(selected) => {
                setEditingTemplate(selected);
              }}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}

      <WorkflowTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateTemplate}
      />

      <WorkflowTemplateForm
        open={!!editingTemplate}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleEditTemplate}
      />

      <ApplyWorkflowDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        templates={templates}
        clients={clients}
        defaultTemplateId={applyingTemplate?.id}
        onApply={handleApply}
      />
    </div>
  );
}
