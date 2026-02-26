"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowTemplate, Client } from "@/lib/types";

// Dialog for applying a workflow template to a client.
// Can be opened from two places:
// 1. Workflows page — user picks which client to apply to (workflow is known)
// 2. Client detail page — user picks which workflow to apply (client is known)

interface ApplyWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkflowTemplate[];
  clients: Client[];
  defaultTemplateId?: string;
  defaultClientId?: string;
  onApply: (templateId: string, clientId: string) => Promise<void>;
}

export function ApplyWorkflowDialog({
  open,
  onOpenChange,
  templates,
  clients,
  defaultTemplateId,
  defaultClientId,
  onApply,
}: ApplyWorkflowDialogProps) {
  const [templateId, setTemplateId] = useState(defaultTemplateId ?? "");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTemplateId(defaultTemplateId ?? "");
      setClientId(defaultClientId ?? "");
      setApplied(false);
      setApplying(false);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  async function handleApply() {
    if (!templateId || !clientId) return;
    setApplying(true);
    setError(null);
    try {
      await onApply(templateId, clientId);
      setApplied(true);
    } catch {
      setError("Failed to apply workflow. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Workflow</DialogTitle>
          <DialogDescription>
            This will create tasks for each step in the workflow, assigned to
            the appropriate team roles.
          </DialogDescription>
        </DialogHeader>

        {applied ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-sm font-medium text-green-700">
              Workflow applied successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Created {selectedTemplate?.steps.length ?? 0} tasks from &ldquo;
              {selectedTemplate?.name}&rdquo;
            </p>
            <Button
              className="mt-4"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show workflow picker if no default template */}
            {!defaultTemplateId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow Template</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.steps.length} steps)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show account picker if no default account */}
            {!defaultClientId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show summary of what will be created */}
            {selectedTemplate && (
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium">{selectedTemplate.name}</p>
                <p className="text-muted-foreground">
                  Will create {selectedTemplate.steps.length} task
                  {selectedTemplate.steps.length !== 1 ? "s" : ""} with
                  deadlines relative to today.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={!templateId || !clientId || applying}
              >
                {applying ? "Applying..." : "Apply Workflow"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
