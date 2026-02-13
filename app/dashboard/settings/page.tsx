"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SourceType } from "@/lib/types";

// Settings page — manage knowledge sources, clients, and integrations.
// The Knowledge Sources section is the main addition: it shows all sources
// with enable/disable toggles, last synced timestamps, and a config dialog.

// Placeholder data until Supabase is connected
interface PlaceholderSource {
  id: string;
  name: string;
  source_type: SourceType;
  enabled: boolean;
  configuration: Record<string, unknown>;
  sync_interval_minutes: number;
  last_synced_at: string | null;
}

const initialSources: PlaceholderSource[] = [
  {
    id: "1",
    name: "Gmail",
    source_type: "gmail",
    enabled: true,
    configuration: {
      query_filter: "in:inbox -category:promotions -category:social -category:updates",
      match_by: "domain_and_email",
    },
    sync_interval_minutes: 15,
    last_synced_at: "2026-02-11T10:30:00Z",
  },
  {
    id: "2",
    name: "Google Drive (Meet Transcripts)",
    source_type: "google_drive",
    enabled: true,
    configuration: {
      mime_type: "application/vnd.google-apps.document",
      name_contains: "Meeting transcript",
    },
    sync_interval_minutes: 60,
    last_synced_at: "2026-02-11T10:00:00Z",
  },
  {
    id: "3",
    name: "Manual Notes",
    source_type: "manual_note",
    enabled: true,
    configuration: {},
    sync_interval_minutes: 0,
    last_synced_at: null,
  },
];

const placeholderClients = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: 2 },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: 1 },
  { id: "3", name: "Initech", domain: "initech.com", contacts: 3 },
];

const sourceTypeLabels: Record<SourceType, string> = {
  gmail: "Email",
  google_drive: "Google Drive",
  manual_note: "Manual",
};

function formatLastSynced(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

export default function SettingsPage() {
  const [sources, setSources] = useState(initialSources);

  // Toggle a source on/off — will call PATCH /api/sources/[id] once connected
  function toggleSource(id: string) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage knowledge sources, clients, and integrations
        </p>
      </div>

      {/* Knowledge Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
          <CardDescription>
            Configure where intelligence is collected from. Each source runs on
            its own schedule and can be toggled independently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between py-3 px-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  {/* Enable/disable toggle */}
                  <button
                    onClick={() => toggleSource(source.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      source.enabled ? "bg-primary" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={source.enabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        source.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{source.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {sourceTypeLabels[source.source_type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last synced: {formatLastSynced(source.last_synced_at)}
                      {source.sync_interval_minutes > 0 && (
                        <> &middot; Every {source.sync_interval_minutes} min</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Edit configuration dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configure {source.name}</DialogTitle>
                      <DialogDescription>
                        Edit the configuration for this knowledge source. Changes
                        take effect on the next sync.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium">
                          Sync Interval (minutes)
                        </label>
                        <Input
                          type="number"
                          defaultValue={source.sync_interval_minutes}
                          className="mt-1"
                          disabled={source.source_type === "manual_note"}
                        />
                        {source.source_type === "manual_note" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Manual notes don&apos;t sync automatically
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Configuration (JSON)
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono min-h-[120px]"
                          defaultValue={JSON.stringify(
                            source.configuration,
                            null,
                            2
                          )}
                        />
                      </div>
                      <Button className="w-full">Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Client Management */}
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Add and manage client records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Client name" className="flex-1" />
            <Input placeholder="Domain (e.g. acme.com)" className="flex-1" />
            <Button>Add Client</Button>
          </div>

          <Separator />

          <div className="space-y-2">
            {placeholderClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between py-2 px-3 rounded-md border"
              >
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.domain} &middot; {client.contacts} contacts
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connection status for external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Google (Gmail + Drive)</p>
              <p className="text-xs text-muted-foreground">
                Email and transcript access
              </p>
            </div>
            <Badge variant="outline">Not Connected</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Gemini AI</p>
              <p className="text-xs text-muted-foreground">
                Intelligence extraction
              </p>
            </div>
            <Badge variant="outline">Not Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
