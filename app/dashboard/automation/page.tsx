"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AutomationRuleCard } from "@/components/dashboard/automation-rule-card";
import { AutomationRuleForm } from "@/components/dashboard/automation-rule-form";
import { mockAutomationRules } from "@/lib/mock-automation";
import type { AutomationRule } from "@/lib/types";

// Automation page — shows all automation rules as cards with enable/disable
// toggles, plus a button to create new rules from templates.

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(mockAutomationRules);
  const [formOpen, setFormOpen] = useState(false);

  function handleToggle(id: string, enabled: boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled } : r))
    );
  }

  function handleCreate(data: Omit<AutomationRule, "id" | "created_at">) {
    const newRule: AutomationRule = {
      ...data,
      id: `auto-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRules((prev) => [newRule, ...prev]);
  }

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-muted-foreground">
            {enabledCount} of {rules.length} rules active — automate repetitive tasks with &ldquo;When X happens, do Y&rdquo; rules
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>New Rule</Button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <AutomationRuleCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No automation rules yet. Click &ldquo;New Rule&rdquo; to get started.
        </p>
      )}

      <AutomationRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
