"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { HealthAlert, Intelligence, Task } from "@/lib/types";

// Activity feed — intelligence entries in reverse chronological order.

type IntelligenceWithClient = Intelligence & { clients?: { name?: string; domain?: string } | null };
type TaskWithClient = Task & { clients?: { name: string } | null };
type QueueItem = {
  id: string;
  source: string;
  source_id: string;
  raw_content: string;
  client_id: string | null;
  created_at: string;
};

type FeedItem = {
  id: string;
  summary: string;
  client: string;
  source: "email" | "transcript" | "note";
  sentiment: string;
  date: string;
  autoTasks: number;
  alerts: number;
};

type UnmatchedItem = {
  id: string;
  summary: string;
  from: string;
  source: "email" | "transcript" | "note";
  date: string;
};

function sentimentColor(sentiment: string) {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800";
    case "negative":
      return "bg-red-100 text-red-800";
    case "mixed":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function sourceCategory(source: Intelligence["source"]): FeedItem["source"] {
  if (source === "gmail") return "email";
  if (source === "google_drive") return "transcript";
  return "note";
}

function sourceLabel(source: FeedItem["source"]) {
  if (source === "email") return "Email";
  if (source === "transcript") return "Transcript";
  return "Note";
}

function ActionIndicators({ autoTasks, alerts }: { autoTasks: number; alerts: number }) {
  if (autoTasks === 0 && alerts === 0) return null;
  return (
    <div className="flex gap-1 mt-1.5">
      {autoTasks > 0 && (
        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
          {autoTasks} task{autoTasks !== 1 ? "s" : ""} created
        </Badge>
      )}
      {alerts > 0 && (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
          {alerts} alert{alerts !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { getRequestHeaders } = useTeamContext();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [unmatchedItems, setUnmatchedItems] = useState<UnmatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);

      try {
        const [intelRes, tasksRes, alertsRes, queueRes] = await Promise.all([
          fetch("/api/intelligence?per_page=100&page=1", { headers: getRequestHeaders() }),
          fetch("/api/tasks", { headers: getRequestHeaders() }),
          fetch("/api/alerts", { headers: getRequestHeaders() }),
          fetch("/api/queue", { headers: getRequestHeaders() }),
        ]);

        const intelJson = (await intelRes.json()) as { data?: IntelligenceWithClient[]; error?: string };
        const tasksJson = (await tasksRes.json()) as { data?: TaskWithClient[]; error?: string };
        const alertsJson = (await alertsRes.json()) as { data?: HealthAlert[]; error?: string };
        const queueJson = (await queueRes.json()) as { data?: QueueItem[]; error?: string };

        if (!intelRes.ok) throw new Error(intelJson.error ?? "Failed to load feed");
        if (!tasksRes.ok) throw new Error(tasksJson.error ?? "Failed to load tasks");
        if (!alertsRes.ok) throw new Error(alertsJson.error ?? "Failed to load alerts");
        if (!queueRes.ok) throw new Error(queueJson.error ?? "Failed to load queue");

        const tasksByIntelligenceId = new Map<string, number>();
        for (const task of tasksJson.data ?? []) {
          if (!task.intelligence_id) continue;
          tasksByIntelligenceId.set(
            task.intelligence_id,
            (tasksByIntelligenceId.get(task.intelligence_id) ?? 0) + 1
          );
        }

        const alertsByIntelligenceId = new Map<string, number>();
        for (const alert of alertsJson.data ?? []) {
          if (!alert.intelligence_id) continue;
          alertsByIntelligenceId.set(
            alert.intelligence_id,
            (alertsByIntelligenceId.get(alert.intelligence_id) ?? 0) + 1
          );
        }

        const mappedFeed: FeedItem[] = (intelJson.data ?? []).map((entry) => ({
          id: entry.id,
          summary: entry.summary,
          client: entry.clients?.name ?? "Unknown client",
          source: sourceCategory(entry.source),
          sentiment: entry.sentiment,
          date: new Date(entry.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          autoTasks: tasksByIntelligenceId.get(entry.id) ?? 0,
          alerts: alertsByIntelligenceId.get(entry.id) ?? 0,
        }));

        const mappedUnmatched: UnmatchedItem[] = (queueJson.data ?? [])
          .filter((item) => !item.client_id)
          .slice(0, 20)
          .map((item) => {
            const summary = item.raw_content.trim();
            return {
              id: item.id,
              summary: summary.length > 120 ? `${summary.slice(0, 117)}...` : summary,
              from: item.source_id || "unknown",
              source:
                item.source === "gmail"
                  ? "email"
                  : item.source === "google_drive"
                    ? "transcript"
                    : "note",
              date: new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            };
          });

        setFeedItems(mappedFeed);
        setUnmatchedItems(mappedUnmatched);
      } catch (error) {
        setFeedItems([]);
        setUnmatchedItems([]);
        setPageError(error instanceof Error ? error.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [getRequestHeaders]);

  const emailItems = useMemo(
    () => feedItems.filter((item) => item.source === "email"),
    [feedItems]
  );
  const transcriptItems = useMemo(
    () => feedItems.filter((item) => item.source === "transcript"),
    [feedItems]
  );

  function renderFeedCards(items: FeedItem[]) {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          No intelligence entries found
        </p>
      );
    }

    return items.map((item) => (
      <Card key={item.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{item.summary}</CardTitle>
              <CardDescription>
                {item.client} &middot; {sourceLabel(item.source)} &middot; {item.date}
              </CardDescription>
              <ActionIndicators autoTasks={item.autoTasks} alerts={item.alerts} />
            </div>
            <Badge variant="secondary" className={sentimentColor(item.sentiment)}>
              {item.sentiment}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    ));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">All intelligence entries across clients</p>
      </div>

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading activity feed...</p>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({feedItems.length})</TabsTrigger>
            <TabsTrigger value="emails">Emails ({emailItems.length})</TabsTrigger>
            <TabsTrigger value="transcripts">
              Transcripts ({transcriptItems.length})
            </TabsTrigger>
            <TabsTrigger value="unmatched">Unmatched ({unmatchedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {renderFeedCards(feedItems)}
          </TabsContent>

          <TabsContent value="emails" className="space-y-3 mt-4">
            {renderFeedCards(emailItems)}
          </TabsContent>

          <TabsContent value="transcripts" className="space-y-3 mt-4">
            {renderFeedCards(transcriptItems)}
          </TabsContent>

          <TabsContent value="unmatched" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              These queue items could not be automatically matched to a client.
            </p>
            <Separator className="mb-3" />
            {unmatchedItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No unmatched entries
              </p>
            )}
            {unmatchedItems.map((item) => (
              <Card key={item.id} className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.summary}</CardTitle>
                      <CardDescription>
                        {item.from} &middot; {sourceLabel(item.source)} &middot; {item.date}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Needs Mapping</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
