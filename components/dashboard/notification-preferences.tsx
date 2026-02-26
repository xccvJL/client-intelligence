"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { NotificationPreferences } from "@/lib/types";

// Toggle switches for each notification type.
// Used in the Settings page under a "Notification Preferences" section.

const preferenceLabels: Record<keyof NotificationPreferences, { label: string; description: string }> = {
  overdue_task: { label: "Overdue tasks", description: "Get notified when a task passes its due date" },
  health_drop: { label: "Health status drops", description: "Get notified when an account's health drops" },
  deal_stagnant: { label: "Stagnant deals", description: "Get notified when a deal hasn't moved stages" },
  upcoming_renewal: { label: "Upcoming renewals", description: "Get reminded about approaching renewal dates" },
  new_intelligence: { label: "New intelligence", description: "Get notified when new insights are extracted" },
  mention: { label: "Mentions", description: "Get notified when someone mentions you" },
  workflow_complete: { label: "Workflow complete", description: "Get notified when a workflow finishes" },
};

const defaultPrefs: NotificationPreferences = {
  overdue_task: true,
  health_drop: true,
  deal_stagnant: true,
  upcoming_renewal: true,
  new_intelligence: false,
  mention: true,
  workflow_complete: false,
};

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(Object.keys(preferenceLabels) as (keyof NotificationPreferences)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{preferenceLabels[key].label}</p>
                <p className="text-xs text-muted-foreground">{preferenceLabels[key].description}</p>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
