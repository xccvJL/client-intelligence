"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockIntegrations } from "@/lib/mock-integrations";
import type { Integration } from "@/lib/types";

// Integration cards with status badges and "Connect" buttons.
// Shows Gmail, Google Calendar, and Gemini AI integration status.

const statusConfig: Record<Integration["status"], { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  disconnected: { label: "Not Connected", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  syncing: { label: "Syncing", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  error: { label: "Error", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

const iconMap: Record<string, string> = {
  mail: "📧",
  calendar: "📅",
  sparkles: "✨",
};

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState(mockIntegrations);

  function toggleConnection(id: string) {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: i.status === "connected" ? "disconnected" : "connected",
              last_synced_at: i.status === "disconnected" ? new Date().toISOString() : i.last_synced_at,
            }
          : i
      )
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect external services to sync emails, calendar events, and enable AI features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => {
            const status = statusConfig[integration.status];
            return (
              <div
                key={integration.id}
                className="flex items-center justify-between py-3 px-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{iconMap[integration.icon] ?? "🔗"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{integration.name}</p>
                      <Badge variant="secondary" className={`${status.className} text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {integration.provider === "google" ? "Google" : integration.provider}
                      {integration.last_synced_at && (
                        <> · Last synced {new Date(integration.last_synced_at).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant={integration.status === "connected" ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleConnection(integration.id)}
                >
                  {integration.status === "connected" ? "Disconnect" : "Connect"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
