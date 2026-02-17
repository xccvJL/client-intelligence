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
import { Textarea } from "@/components/ui/textarea";
import { useTeamContext } from "@/components/dashboard/team-context";
import { IntegrationsPanel } from "@/components/dashboard/integrations-panel";
import { EmailPreview } from "@/components/dashboard/email-preview";
import { CalendarPreview } from "@/components/dashboard/calendar-preview";
import { NotificationPreferencesPanel } from "@/components/dashboard/notification-preferences";
import { defaultPrompts, defaultPromptsMap } from "@/lib/default-prompts";
import type { SourceType, Client, Deal, IncomingLead } from "@/lib/types";

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
  const { addIncomingLead, currentUser, systemPrompts, setSystemPrompts, getPrompt } = useTeamContext();

  // Local editing state for AI prompts — tracks in-progress edits before saving
  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({});

  // --- Lead Capture Webhook state ---
  const [webhookApiKey, setWebhookApiKey] = useState("");
  const [testName, setTestName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testCompany, setTestCompany] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  async function handleTestSubmit() {
    setTestStatus("sending");
    setTestError("");

    try {
      const res = await fetch("/api/webhooks/lead-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": webhookApiKey,
        },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          company: testCompany,
          phone: testPhone || undefined,
          message: testMessage || undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${res.status})`);
      }

      const { data } = await res.json();

      // Push the lead into shared context so it appears in Accounts + Pipeline
      const lead: IncomingLead = {
        client: data.client as Client,
        deal: { ...data.deal, clients: { name: data.client.name } } as Deal & { clients?: { name: string } | null },
        received_at: new Date().toISOString(),
      };
      addIncomingLead(lead);

      setTestStatus("success");
      // Reset the form
      setTestName("");
      setTestEmail("");
      setTestCompany("");
      setTestPhone("");
      setTestMessage("");
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Unknown error");
    }
  }

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

      {/* Integrations — full panel with connect/disconnect and sync previews */}
      <IntegrationsPanel />

      {/* Sample synced emails */}
      <EmailPreview />

      {/* Upcoming calendar events */}
      <CalendarPreview />

      <Separator />

      {/* Notification Preferences */}
      <NotificationPreferencesPanel />

      <Separator />

      {/* AI System Prompts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI System Prompts</CardTitle>
              <CardDescription>
                Customize the instructions given to the AI for each feature.
                These control the AI&apos;s role and behavior &mdash; the output
                format and data injection are handled automatically and
                can&apos;t be changed here.
              </CardDescription>
            </div>
            {Object.keys(systemPrompts).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSystemPrompts({});
                  setPromptEdits({});
                }}
              >
                Reset All to Defaults
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultPrompts.map((def) => {
            // What the textarea currently shows: local edit > saved custom > default
            const currentValue =
              promptEdits[def.key] ??
              systemPrompts[def.key] ??
              def.defaultPrompt;
            const isCustomized = def.key in systemPrompts;
            const hasUnsavedEdit =
              def.key in promptEdits &&
              promptEdits[def.key] !== (systemPrompts[def.key] ?? def.defaultPrompt);

            return (
              <div key={def.key} className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">{def.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {def.description}
                  </p>
                </div>

                <Textarea
                  className="font-mono text-xs min-h-[100px]"
                  value={currentValue}
                  onChange={(e) =>
                    setPromptEdits((prev) => ({
                      ...prev,
                      [def.key]: e.target.value,
                    }))
                  }
                  rows={4}
                />

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!hasUnsavedEdit}
                    onClick={() => {
                      const value = promptEdits[def.key];
                      // If the edit matches the default, remove the override instead
                      if (value === def.defaultPrompt) {
                        setSystemPrompts((prev) => {
                          const next = { ...prev };
                          delete next[def.key];
                          return next;
                        });
                      } else {
                        setSystemPrompts((prev) => ({
                          ...prev,
                          [def.key]: value,
                        }));
                      }
                      // Clear the local edit
                      setPromptEdits((prev) => {
                        const next = { ...prev };
                        delete next[def.key];
                        return next;
                      });
                    }}
                  >
                    Save
                  </Button>

                  {isCustomized && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Remove the saved override
                        setSystemPrompts((prev) => {
                          const next = { ...prev };
                          delete next[def.key];
                          return next;
                        });
                        // Clear any in-progress edit
                        setPromptEdits((prev) => {
                          const next = { ...prev };
                          delete next[def.key];
                          return next;
                        });
                      }}
                    >
                      Reset to Default
                    </Button>
                  )}

                  {isCustomized && (
                    <Badge variant="secondary" className="text-xs">
                      Customized
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Lead Capture Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Capture Webhook</CardTitle>
          <CardDescription>
            Connect an external form (Typeform, JotForm, WordPress, etc.) to
            automatically create accounts and deals from submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL */}
          <div>
            <label className="text-sm font-medium">Webhook URL</label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/webhooks/lead-form`
                    : "/api/webhooks/lead-form"
                }
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/api/webhooks/lead-form`;
                  navigator.clipboard.writeText(url);
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              POST JSON to this URL with an <code>x-api-key</code> header.
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              placeholder="Paste your WEBHOOK_API_KEY here"
              value={webhookApiKey}
              onChange={(e) => setWebhookApiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must match the <code>WEBHOOK_API_KEY</code> environment variable
              on the server.
            </p>
          </div>

          <Separator />

          {/* Field reference */}
          <div>
            <p className="text-sm font-medium mb-2">Expected JSON fields</p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-1.5 font-medium">Field</th>
                    <th className="text-left px-3 py-1.5 font-medium">Type</th>
                    <th className="text-left px-3 py-1.5 font-medium">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { field: "name", type: "string", required: true },
                    { field: "email", type: "string", required: true },
                    { field: "company", type: "string", required: true },
                    { field: "phone", type: "string", required: false },
                    { field: "message", type: "string", required: false },
                  ].map((row) => (
                    <tr key={row.field} className="border-t">
                      <td className="px-3 py-1.5 font-mono text-xs">{row.field}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.type}</td>
                      <td className="px-3 py-1.5">
                        {row.required ? (
                          <Badge variant="default" className="text-xs">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Test form */}
          <div>
            <p className="text-sm font-medium mb-2">Send a test submission</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Name *"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Company *"
                  value={testCompany}
                  onChange={(e) => setTestCompany(e.target.value)}
                />
                <Input
                  placeholder="Phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Message (optional)"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
              />
              <Button
                onClick={handleTestSubmit}
                disabled={testStatus === "sending" || !testName || !testEmail || !testCompany || !webhookApiKey}
              >
                {testStatus === "sending" ? "Sending..." : "Send Test"}
              </Button>

              {testStatus === "success" && (
                <p className="text-sm text-green-600">
                  Lead created successfully! Check the Accounts and Pipeline pages.
                </p>
              )}
              {testStatus === "error" && (
                <p className="text-sm text-red-600">
                  Error: {testError}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
