"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientApplyWorkflowButton } from "@/components/dashboard/client-apply-workflow-button";
import { MeetingPrep } from "@/components/dashboard/meeting-prep";
import { AccountDetailTabs } from "@/components/dashboard/account-detail-tabs";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Client, Intelligence } from "@/lib/types";

interface IntelligenceEntry {
  id: string;
  summary: string;
  source: string;
  sentiment: string;
  date: string;
  topics: string[];
  actionItems: string[];
}

function sourceLabel(source: Intelligence["source"]): string {
  if (source === "gmail") return "Email";
  if (source === "google_drive") return "Drive";
  if (source === "manual_note") return "Note";
  return "Source";
}

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getRequestHeaders } = useTeamContext();

  const [client, setClient] = useState<Client | null>(null);
  const [intelligence, setIntelligence] = useState<Intelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    async function loadData() {
      setLoading(true);
      setPageError(null);

      try {
        const [clientRes, intelRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`, { headers: getRequestHeaders() }),
          fetch(`/api/intelligence?client_id=${clientId}&per_page=100&page=1`, {
            headers: getRequestHeaders(),
          }),
        ]);

        const clientJson = (await clientRes.json()) as { data?: Client; error?: string };
        const intelJson = (await intelRes.json()) as { data?: Intelligence[]; error?: string };

        if (!clientRes.ok) {
          throw new Error(clientJson.error ?? "Failed to load account");
        }
        if (!intelRes.ok) {
          throw new Error(intelJson.error ?? "Failed to load intelligence");
        }

        setClient(clientJson.data ?? null);
        setIntelligence(intelJson.data ?? []);
      } catch (error) {
        setClient(null);
        setIntelligence([]);
        setPageError(error instanceof Error ? error.message : "Failed to load account");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [clientId, getRequestHeaders]);

  const intelligenceEntries = useMemo<IntelligenceEntry[]>(() => {
    return intelligence.map((item) => ({
      id: item.id,
      summary: item.summary,
      source: sourceLabel(item.source),
      sentiment: item.sentiment,
      date: new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      topics: item.topics,
      actionItems: item.action_items.map((action) => action.description),
    }));
  }, [intelligence]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading account...</p>;
  }

  if (pageError || !client || !clientId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{pageError ?? "Account not found"}</p>
        <Link href="/dashboard/accounts" className="text-sm text-muted-foreground hover:text-foreground">
          Back to accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="/dashboard/accounts"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Accounts
            </Link>
            <span className="text-muted-foreground">/</span>
          </div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.domain}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MeetingPrep
            clientId={clientId}
            clientName={client.name}
            intelligence={intelligence}
          />
          <ClientApplyWorkflowButton clientId={clientId} />
          <div className="flex gap-1 ml-1">
            {(client.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <AccountDetailTabs
        clientId={clientId}
        clientName={client.name}
        intelligence={intelligenceEntries}
        intelligenceForAI={intelligence}
      />
    </div>
  );
}
