"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { triggerLabels, actionLabels } from "@/lib/mock-automation";
import type { AutomationRule, AutomationTrigger, AutomationAction } from "@/lib/types";

// Two-step dialog for creating a new automation rule:
// Step 1: Pick trigger and action
// Step 2: Name and description

const triggerOptions = Object.entries(triggerLabels) as [AutomationTrigger, string][];
const actionOptions = Object.entries(actionLabels) as [AutomationAction, string][];

interface AutomationRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rule: Omit<AutomationRule, "id" | "created_at">) => void;
}

export function AutomationRuleForm({ open, onOpenChange, onSubmit }: AutomationRuleFormProps) {
  const [step, setStep] = useState(1);
  const [trigger, setTrigger] = useState<AutomationTrigger>("deal_stage_changed");
  const [action, setAction] = useState<AutomationAction>("create_task");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSubmit({
      name,
      description,
      trigger,
      trigger_config: {},
      action,
      action_config: {},
      enabled: true,
    });
    // Reset
    setStep(1);
    setName("");
    setDescription("");
    setTrigger("deal_stage_changed");
    setAction("create_task");
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) setStep(1);
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "New Automation Rule" : "Name Your Rule"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose what triggers the rule and what action it takes"
              : "Give your rule a name and description"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">When this happens...</label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as AutomationTrigger)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Do this...</label>
              <Select value={action} onValueChange={(v) => setAction(v as AutomationAction)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Rule name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Auto-create onboarding tasks"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this rule does..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} type="button">
                Back
              </Button>
              <Button className="flex-1" type="submit">
                Create Rule
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
