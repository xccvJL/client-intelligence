"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkflowTemplate, TeamRole } from "@/lib/types";

// Compact card for displaying a workflow template in the workflows list.
// Shows name, description, step count, role breakdown, and an "Apply" button.

const roleLabels: Record<TeamRole, string> = {
  sales: "Sales",
  onboarding: "Onboarding",
  account_manager: "Account Manager",
  specialist: "Specialist",
};

interface WorkflowCardProps {
  template: WorkflowTemplate;
  onApply: (template: WorkflowTemplate) => void;
  onEdit?: (template: WorkflowTemplate) => void;
  onDelete?: (templateId: string) => void;
}

export function WorkflowCard({ template, onApply, onEdit, onDelete }: WorkflowCardProps) {
  // Collect unique roles used in the steps
  const roles = [...new Set(template.steps.map((s) => s.assigned_role))];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {roles.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {roleLabels[role]}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onApply(template)}>
            Apply to Client
          </Button>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(template.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
