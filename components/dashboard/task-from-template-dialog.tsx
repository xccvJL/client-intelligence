"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkflowTemplate, WorkflowStep, TeamRole, TaskPriority } from "@/lib/types";

// Dialog that lists workflow templates, lets user pick a template
// then a step, and returns the step data mapped to task fields.

const roleLabels: Record<TeamRole, string> = {
  sales: "Sales",
  onboarding: "Onboarding",
  account_manager: "Account Manager",
  specialist: "Specialist",
};

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

interface TaskFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkflowTemplate[];
  onSelect: (step: WorkflowStep) => void;
}

export function TaskFromTemplateDialog({
  open,
  onOpenChange,
  templates,
  onSelect,
}: TaskFromTemplateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  function handleSelect(step: WorkflowStep) {
    onSelect(step);
    setSelectedTemplateId(null);
    onOpenChange(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) setSelectedTemplateId(null);
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? `${selectedTemplate.name} — Pick a Step` : "Create Task from Template"}
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No workflow templates available. Create one on the Workflows page first.
              </p>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left rounded-md border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="mb-1"
              onClick={() => setSelectedTemplateId(null)}
            >
              &larr; Back to templates
            </Button>

            {selectedTemplate.steps.map((step, index) => (
              <button
                key={index}
                className="w-full text-left rounded-md border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                onClick={() => handleSelect(step)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {step.order}. {step.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className={`text-xs ${priorityColors[step.priority]}`}>
                      {step.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                      {roleLabels[step.assigned_role]}
                    </Badge>
                  </div>
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
