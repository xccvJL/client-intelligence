"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowTemplate, WorkflowStep, TeamRole, TaskPriority } from "@/lib/types";

// Dialog form for creating or editing a workflow template.
// Has name + description fields at the top, then a list of steps
// that can be added, removed, and configured individually.

const roleLabels: Record<TeamRole, string> = {
  sales: "Sales",
  onboarding: "Onboarding",
  account_manager: "Account Manager",
  specialist: "Specialist",
};

interface WorkflowTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WorkflowTemplate | null;
  onSubmit: (data: {
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) => void;
}

function emptyStep(order: number): WorkflowStep {
  return {
    title: "",
    description: null,
    assigned_role: "onboarding",
    priority: "medium",
    due_in_days: 0,
    order,
  };
}

export function WorkflowTemplateForm({
  open,
  onOpenChange,
  template,
  onSubmit,
}: WorkflowTemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([emptyStep(1)]);

  // Populate form when editing an existing template, or reset for new
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description ?? "");
        setSteps(template.steps.length > 0 ? template.steps : [emptyStep(1)]);
      } else {
        setName("");
        setDescription("");
        setSteps([emptyStep(1)]);
      }
    }
  }, [open, template]);

  function updateStep(index: number, updates: Partial<WorkflowStep>) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, emptyStep(prev.length + 1)]);
  }

  function removeStep(index: number) {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 }))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || steps.length === 0) return;

    // Make sure every step has a title
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
    });
    onOpenChange(false);
  }

  const isEditing = !!template;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Workflow Template" : "Create Workflow Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template name and description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              placeholder="e.g., Client Onboarding"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="What is this workflow for? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Steps ({steps.length})
              </label>
              <Button type="button" size="sm" variant="outline" onClick={addStep}>
                Add Step
              </Button>
            </div>

            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-md border p-3 space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 h-7 px-2"
                      onClick={() => removeStep(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Step title"
                  value={step.title}
                  onChange={(e) => updateStep(index, { title: e.target.value })}
                  required
                />

                <Input
                  placeholder="Description (optional)"
                  value={step.description ?? ""}
                  onChange={(e) =>
                    updateStep(index, {
                      description: e.target.value || null,
                    })
                  }
                />

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Role</label>
                    <Select
                      value={step.assigned_role}
                      onValueChange={(v) =>
                        updateStep(index, { assigned_role: v as TeamRole })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleLabels) as TeamRole[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <Select
                      value={step.priority}
                      onValueChange={(v) =>
                        updateStep(index, { priority: v as TaskPriority })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Due in (days)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={step.due_in_days}
                      onChange={(e) =>
                        updateStep(index, {
                          due_in_days: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || steps.length === 0}>
              {isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
