"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowCard } from "@/components/dashboard/workflow-card";
import { WorkflowTemplateForm } from "@/components/dashboard/workflow-template-form";
import { ApplyWorkflowDialog } from "@/components/dashboard/apply-workflow-dialog";
import type { WorkflowTemplate, WorkflowStep, Client } from "@/lib/types";

// Workflows page — lists all workflow templates as cards.
// Includes a pre-built "Thrive Local Onboarding" template and lets users
// create new templates, edit existing ones, and apply them to clients.

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "3", name: "Initech", domain: "initech.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

// The pre-built Thrive Local Onboarding template — matches the real process
const thriveOnboardingTemplate: WorkflowTemplate = {
  id: "wf-thrive-onboarding",
  name: "Thrive Local Onboarding",
  description:
    "Standard onboarding workflow for new Thrive Local clients. Covers the full handoff from Sales through Account Management.",
  steps: [
    {
      title: "Mark Thrive Local status on deal",
      description: "Update the deal stage to reflect Thrive Local enrollment.",
      assigned_role: "sales",
      priority: "medium",
      due_in_days: 0,
      order: 1,
    },
    {
      title: "Set up project overview, add Tim & Ralph",
      description:
        "Create the project in the system and add key team members.",
      assigned_role: "onboarding",
      priority: "high",
      due_in_days: 1,
      order: 2,
    },
    {
      title: "Send intro email with Calendly links",
      description:
        "Send the client an introduction email with scheduling links for their onboarding calls.",
      assigned_role: "sales",
      priority: "high",
      due_in_days: 1,
      order: 3,
    },
    {
      title: "Alert specialists when GBP is connected",
      description:
        "Notify the specialist team once the client's Google Business Profile is connected.",
      assigned_role: "onboarding",
      priority: "medium",
      due_in_days: 3,
      order: 4,
    },
    {
      title: "Monitor status, help client connect platforms",
      description:
        "Track progress and assist the client with connecting their various platforms and accounts.",
      assigned_role: "onboarding",
      priority: "medium",
      due_in_days: 7,
      order: 5,
    },
    {
      title: "Handoff to AM if no movement",
      description:
        "If the client hasn't made progress, escalate to the Account Manager for direct outreach.",
      assigned_role: "account_manager",
      priority: "low",
      due_in_days: 14,
      order: 6,
    },
  ],
  created_at: "2026-01-15T00:00:00Z",
  updated_at: "2026-01-15T00:00:00Z",
};

export default function WorkflowsPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([
    thriveOnboardingTemplate,
  ]);
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
