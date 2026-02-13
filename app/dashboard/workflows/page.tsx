"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowCard } from "@/components/dashboard/workflow-card";
import { WorkflowTemplateForm } from "@/components/dashboard/workflow-template-form";
import { ApplyWorkflowDialog } from "@/components/dashboard/apply-workflow-dialog";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { WorkflowTemplate, WorkflowStep, Client } from "@/lib/types";

// Workflows page — lists all workflow templates as cards.
// Includes a pre-built "Thrive Local Onboarding" template and lets users
// create new templates, edit existing ones, and apply them to clients.

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "3", name: "Initech", domain: "initech.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

export default function WorkflowsPage() {
  const { workflowTemplates: templates, setWorkflowTemplates: setTemplates } = useTeamContext();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] =
    useState<WorkflowTemplate | null>(null);

  function handleCreateTemplate(data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) {
    const newTemplate: WorkflowTemplate = {
      id: `wf-${Date.now()}`,
      name: data.name,
      description: data.description || null,
      steps: data.steps,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
  }

  function handleEditTemplate(data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) {
    if (!editingTemplate) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: data.name,
              description: data.description || null,
              steps: data.steps,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
    setEditingTemplate(null);
  }

  function handleDeleteTemplate(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }

  function handleApplyClick(template: WorkflowTemplate) {
    setApplyingTemplate(template);
    setApplyDialogOpen(true);
  }

  function handleApply(templateId: string, clientId: string) {
    // In a real app, this would call POST /api/workflows/:id/apply
    // For now, it just shows the confirmation in the dialog
    console.log(`Applying workflow ${templateId} to client ${clientId}`);
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

      {templates.length === 0 ? (
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
              onEdit={(t) => {
                setEditingTemplate(t);
              }}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}

      {/* Create new template dialog */}
      <WorkflowTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateTemplate}
      />

      {/* Edit existing template dialog */}
      <WorkflowTemplateForm
        open={!!editingTemplate}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleEditTemplate}
      />

      {/* Apply workflow to client dialog */}
      <ApplyWorkflowDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        templates={templates}
        clients={placeholderClients}
        defaultTemplateId={applyingTemplate?.id}
        onApply={handleApply}
      />
    </div>
  );
}
