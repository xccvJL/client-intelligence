"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplyWorkflowDialog } from "@/components/dashboard/apply-workflow-dialog";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { WorkflowTemplate } from "@/lib/types";

interface ClientApplyWorkflowButtonProps {
  clientId: string;
}

export function ClientApplyWorkflowButton({ clientId }: ClientApplyWorkflowButtonProps) {
  const { getRequestHeaders } = useTeamContext();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/workflows", {
          headers: getRequestHeaders(),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: WorkflowTemplate[] };
        setTemplates(json.data ?? []);
      } catch {
        setTemplates([]);
      }
    }

    void loadTemplates();
  }, [getRequestHeaders]);

  async function handleApply(templateId: string, clientIdParam: string) {
    const res = await fetch(`/api/workflows/${templateId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getRequestHeaders(),
      },
      body: JSON.stringify({ client_id: clientIdParam }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Failed to apply workflow");
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={templates.length === 0}
      >
        Apply Workflow
      </Button>

      <ApplyWorkflowDialog
        open={open}
        onOpenChange={setOpen}
        templates={templates}
        clients={[]}
        defaultClientId={clientId}
        onApply={handleApply}
      />
    </>
  );
}
