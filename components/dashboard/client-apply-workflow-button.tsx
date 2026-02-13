"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplyWorkflowDialog } from "@/components/dashboard/apply-workflow-dialog";
import type { WorkflowTemplate, Client } from "@/lib/types";

// A button + dialog combo for the client detail page header.
// Pre-fills the client, so the user only needs to pick a workflow.

// These match the placeholder data used in the workflows page
const placeholderTemplates: WorkflowTemplate[] = [
  {
    id: "wf-thrive-onboarding",
    name: "Thrive Local Onboarding",
    description: "Standard onboarding workflow for new Thrive Local clients.",
    steps: [
      { title: "Mark Thrive Local status on deal", description: null, assigned_role: "sales", priority: "medium", due_in_days: 0, order: 1 },
      { title: "Set up project overview, add Tim & Ralph", description: null, assigned_role: "onboarding", priority: "high", due_in_days: 1, order: 2 },
      { title: "Send intro email with Calendly links", description: null, assigned_role: "sales", priority: "high", due_in_days: 1, order: 3 },
      { title: "Alert specialists when GBP is connected", description: null, assigned_role: "onboarding", priority: "medium", due_in_days: 3, order: 4 },
      { title: "Monitor status, help client connect platforms", description: null, assigned_role: "onboarding", priority: "medium", due_in_days: 7, order: 5 },
      { title: "Handoff to AM if no movement", description: null, assigned_role: "account_manager", priority: "low", due_in_days: 14, order: 6 },
    ],
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
];

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

interface ClientApplyWorkflowButtonProps {
  clientId: string;
}

export function ClientApplyWorkflowButton({ clientId }: ClientApplyWorkflowButtonProps) {
  const [open, setOpen] = useState(false);

  function handleApply(templateId: string, clientIdParam: string) {
    // In a real app, this would call POST /api/workflows/:id/apply
    console.log(`Applying workflow ${templateId} to client ${clientIdParam}`);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Apply Workflow
      </Button>

      <ApplyWorkflowDialog
        open={open}
        onOpenChange={setOpen}
        templates={placeholderTemplates}
        clients={placeholderClients}
        defaultClientId={clientId}
        onApply={handleApply}
      />
    </>
  );
}
