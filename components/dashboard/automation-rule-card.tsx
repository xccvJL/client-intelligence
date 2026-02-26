"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { triggerLabels, actionLabels } from "@/lib/mock-automation";
import type { AutomationRule } from "@/lib/types";

// Rule card with enable/disable toggle, trigger/action description.

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onToggle: (id: string, enabled: boolean) => void;
}

export function AutomationRuleCard({ rule, onToggle }: AutomationRuleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base">{rule.name}</CardTitle>
            <CardDescription className="mt-1">{rule.description}</CardDescription>
          </div>
          <Switch
            checked={rule.enabled}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            When: {triggerLabels[rule.trigger] ?? rule.trigger}
          </Badge>
          <span className="text-xs text-muted-foreground">→</span>
          <Badge variant="secondary" className="text-xs">
            Then: {actionLabels[rule.action] ?? rule.action}
          </Badge>
          {!rule.enabled && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Paused
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
