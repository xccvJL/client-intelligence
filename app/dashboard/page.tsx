"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "@/components/dashboard/health-badge";
import { NudgesPanel } from "@/components/dashboard/nudges-panel";
import { DashboardBriefing } from "@/components/dashboard/dashboard-briefing";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { useTeamContext } from "@/components/dashboard/team-context";
import type {
  ActivityLogEntry,
  Client,
  Deal,
  DealStage,
  HealthAlert,
  HealthStatus,
  Intelligence,
  Task,
} from "@/lib/types";

// Main dashboard — stats, pipeline snapshot, tasks, alerts, account grid, and activity.

type DealWithClient = Deal & { clients?: { name: string } | null };
type TaskWithClient = Task & { clients?: { name: string } | null };
type IntelligenceWithClient = Intelligence & { clients?: { name: string; domain?: string } | null };
type ClientDetail = Client & { intelligence_count?: number };

const stageOrder: DealStage[] = ["lead", "proposal", "active", "closed_won"];

const priorityWeight: Record<Task["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function sourceLabel(source: Intelligence["source"]) {
  if (source === "gmail") return "email";
  if (source === "google_drive") return "transcript";
  return "note";
}

function formatDueLabel(date: string | null) {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { getRequestHeaders, currentUser } = useTeamContext();

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<DealWithClient[]>([]);
  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceWithClient[]>([]);
  const [intelligenceTotal, setIntelligenceTotal] = useState(0);
  const [healthByClientId, setHealthByClientId] = useState<Record<string, HealthStatus>>({});
  const [renewalByClientId, setRenewalByClientId] = useState<Record<string, string | null>>({});
  const [intelligenceCountByClientId, setIntelligenceCountByClientId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const entriesByClientId = useMemo(() => {
    if (Object.keys(intelligenceCountByClientId).length > 0) {
      return intelligenceCountByClientId;
    }

    const counts: Record<string, number> = {};
    for (const entry of intelligence) {
      if (!entry.client_id) continue;
      counts[entry.client_id] = (counts[entry.client_id] ?? 0) + 1;
    }
    return counts;
  }, [intelligence, intelligenceCountByClientId]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<DealStage, number> = {
      lead: 0,
      proposal: 0,
      active: 0,
      closed_won: 0,
      closed_lost: 0,
    };

    for (const deal of deals) {
      counts[deal.stage] += 1;
    }

    return counts;
  }, [deals]);

  const pipelineValue = useMemo(
    () =>
      deals
        .filter((deal) => deal.stage !== "closed_lost")
        .reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
    [deals]
  );

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks]
  );

  const urgentTasks = useMemo(() => {
    const scoped = currentUser
      ? openTasks.filter((task) => task.assignee_id === currentUser.id)
      : openTasks;
    const base = scoped.length > 0 ? scoped : openTasks;

    return [...base]
      .sort((a, b) => {
        const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title,
        client: task.clients?.name ?? clientNameById.get(task.client_id) ?? "Unknown",
        priority: task.priority,
        due: formatDueLabel(task.due_date),
      }));
  }, [clientNameById, currentUser, openTasks]);

  const atRiskCount = useMemo(
    () => clients.filter((client) => healthByClientId[client.id] === "at_risk").length,
    [clients, healthByClientId]
  );

  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    return clients.filter((client) => {
      const renewalDate = renewalByClientId[client.id];
      if (!renewalDate) return false;
      const parsed = new Date(renewalDate);
      return parsed >= now && parsed <= ninetyDaysFromNow;
    }).length;
  }, [clients, renewalByClientId]);

  const alertRows = useMemo(
    () =>
      alerts
        .filter((alert) => !alert.acknowledged)
        .slice(0, 5)
        .map((alert) => ({
          id: alert.id,
          message: alert.message,
          client: clientNameById.get(alert.client_id) ?? "Unknown",
          severity: alert.severity,
        })),
    [alerts, clientNameById]
  );

  const activityEntries = useMemo<ActivityLogEntry[]>(() => {
    return intelligence.slice(0, 20).map((entry) => {
      const description = `New ${sourceLabel(entry.source)} intelligence: ${entry.summary}`;
      return {
        id: `intel-${entry.id}`,
        event_type: "intelligence_received",
        description,
        actor_name: "System",
        account_name: entry.clients?.name ?? clientNameById.get(entry.client_id ?? "") ?? null,
        account_id: entry.client_id,
        metadata: {
          intelligence_id: entry.id,
          source: entry.source,
        },
        created_at: entry.created_at,
      };
    });
  }, [clientNameById, intelligence]);

  const briefingSummary = useMemo(() => {
    const accountLines = clients
      .map((client) => {
        const health = healthByClientId[client.id] ?? "healthy";
        const entries = entriesByClientId[client.id] ?? 0;
        const tags = client.tags.length > 0 ? client.tags.join(", ") : "none";
        return `- ${client.name} (ID: ${client.id}): health=${health}, ${entries} intelligence entries, tags=${tags}`;
      })
      .join("\n");

    const taskLines = urgentTasks
      .map((task) => `- ${task.title} (${task.client}, priority=${task.priority}, due=${task.due})`)
      .join("\n");

    const alertLines = alertRows
      .map((alert) => `- ${alert.message} (${alert.client}, severity=${alert.severity})`)
      .join("\n");

    const pipeline = stageOrder
      .map((stage) => `${stage}: ${pipelineCounts[stage] ?? 0}`)
      .join(", ");

    return `ACCOUNTS:\n${accountLines || "- none"}\n\nURGENT TASKS:\n${taskLines || "- none"}\n\nHEALTH ALERTS:\n${alertLines || "- none"}\n\nPIPELINE: ${pipeline}\nTotal pipeline value: ${formatCurrency(pipelineValue)}\nUpcoming renewals: ${upcomingRenewals}`;
  }, [
    alertRows,
    clients,
    entriesByClientId,
    healthByClientId,
    pipelineCounts,
    pipelineValue,
    upcomingRenewals,
    urgentTasks,
  ]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);

      try {
        const [clientsRes, dealsRes, tasksRes, alertsRes, intelRes] = await Promise.all([
          fetch("/api/clients", { headers: getRequestHeaders() }),
          fetch("/api/deals", { headers: getRequestHeaders() }),
          fetch("/api/tasks", { headers: getRequestHeaders() }),
          fetch("/api/alerts?acknowledged=false", { headers: getRequestHeaders() }),
          fetch("/api/intelligence?per_page=100&page=1", { headers: getRequestHeaders() }),
        ]);

        const clientsJson = (await clientsRes.json()) as { data?: Client[]; error?: string };
        const dealsJson = (await dealsRes.json()) as { data?: DealWithClient[]; error?: string };
        const tasksJson = (await tasksRes.json()) as { data?: TaskWithClient[]; error?: string };
        const alertsJson = (await alertsRes.json()) as { data?: HealthAlert[]; error?: string };
        const intelJson = (await intelRes.json()) as {
          data?: IntelligenceWithClient[];
          count?: number;
          error?: string;
        };

        if (!clientsRes.ok) throw new Error(clientsJson.error ?? "Failed to load clients");
        if (!dealsRes.ok) throw new Error(dealsJson.error ?? "Failed to load deals");
        if (!tasksRes.ok) throw new Error(tasksJson.error ?? "Failed to load tasks");
        if (!alertsRes.ok) throw new Error(alertsJson.error ?? "Failed to load alerts");
        if (!intelRes.ok) throw new Error(intelJson.error ?? "Failed to load intelligence");

        const fetchedClients = clientsJson.data ?? [];
        const fetchedAlerts = alertsJson.data ?? [];

        setClients(fetchedClients);
        setDeals(dealsJson.data ?? []);
        setTasks(tasksJson.data ?? []);
        setAlerts(fetchedAlerts);
        setIntelligence(intelJson.data ?? []);
        setIntelligenceTotal(intelJson.count ?? (intelJson.data ?? []).length);

        const defaultHealthMap: Record<string, HealthStatus> = {};
        const renewalMap: Record<string, string | null> = {};
        for (const client of fetchedClients) {
          defaultHealthMap[client.id] = client.status === "archived" ? "churning" : "healthy";
          renewalMap[client.id] = null;
        }

        for (const alert of fetchedAlerts) {
          if (alert.severity === "critical") {
            defaultHealthMap[alert.client_id] = "churning";
          } else if (defaultHealthMap[alert.client_id] !== "churning") {
            defaultHealthMap[alert.client_id] = "at_risk";
          }
        }

        const [healthResults, detailResults] = await Promise.all([
          Promise.all(
            fetchedClients.map(async (client) => {
              try {
                const res = await fetch(`/api/clients/${client.id}/health`, {
                  headers: getRequestHeaders(),
                });
                const json = (await res.json()) as {
                  data?: { status?: HealthStatus; renewal_date?: string | null };
                };
                if (!res.ok || !json.data) {
                  return { clientId: client.id, status: null, renewalDate: null };
                }
                return {
                  clientId: client.id,
                  status: json.data.status ?? null,
                  renewalDate: json.data.renewal_date ?? null,
                };
              } catch {
                return { clientId: client.id, status: null, renewalDate: null };
              }
            })
          ),
          Promise.all(
            fetchedClients.map(async (client) => {
              try {
                const res = await fetch(`/api/clients/${client.id}`, {
                  headers: getRequestHeaders(),
                });
                const json = (await res.json()) as { data?: ClientDetail };
                if (!res.ok || !json.data) {
                  return { clientId: client.id, intelligenceCount: 0 };
                }
                return {
                  clientId: client.id,
                  intelligenceCount: json.data.intelligence_count ?? 0,
                };
              } catch {
                return { clientId: client.id, intelligenceCount: 0 };
              }
            })
          ),
        ]);

        for (const result of healthResults) {
          if (result.status) {
            defaultHealthMap[result.clientId] = result.status;
          }
          if (result.renewalDate) {
            renewalMap[result.clientId] = result.renewalDate;
          }
        }

        const countsMap: Record<string, number> = {};
        for (const result of detailResults) {
          countsMap[result.clientId] = result.intelligenceCount;
        }

        setHealthByClientId(defaultHealthMap);
        setRenewalByClientId(renewalMap);
        setIntelligenceCountByClientId(countsMap);
      } catch (error) {
        setClients([]);
        setDeals([]);
        setTasks([]);
        setAlerts([]);
        setIntelligence([]);
        setIntelligenceTotal(0);
        setHealthByClientId({});
        setRenewalByClientId({});
        setIntelligenceCountByClientId({});
        setPageError(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [getRequestHeaders]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Account overview and recent intelligence</p>
      </div>

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      <DashboardBriefing summaryText={briefingSummary} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
            <CardTitle className="text-3xl">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Intelligence</CardDescription>
            <CardTitle className="text-3xl">{intelligenceTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline Value</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(pipelineValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tasks</CardDescription>
            <CardTitle className="text-3xl">{openTasks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At-Risk Accounts</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{atRiskCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Renewals</CardDescription>
            <CardTitle className="text-3xl">{upcomingRenewals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pipeline Snapshot</CardTitle>
              <Link
                href="/dashboard/accounts"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View pipeline
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {stageOrder.map((stage) => (
                <div key={stage} className="text-center">
                  <p className="text-2xl font-bold">{pipelineCounts[stage] ?? 0}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {stage === "closed_won" ? "Won" : stage}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Tasks</CardTitle>
              <Link
                href="/dashboard/tasks"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No open tasks</p>
              )}
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.client}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{task.due}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <NudgesPanel />

      {alertRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Health Alerts ({alertRows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertRows.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <Badge
                    variant="secondary"
                    className={
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-800 text-xs shrink-0"
                        : "bg-yellow-100 text-yellow-800 text-xs shrink-0"
                    }
                  >
                    {alert.severity === "critical" ? "!!" : "!"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.client}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Accounts</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clients.map((client) => {
              const accountDeals = deals.filter((deal) => deal.client_id === client.id);
              const activeDealValue = accountDeals
                .filter((deal) => deal.stage !== "closed_lost")
                .reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

              return (
                <Link key={client.id} href={`/dashboard/accounts/${client.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <CardDescription>{client.domain}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={
                              client.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-xs"
                            }
                          >
                            {client.status === "active" ? "Active" : "Archived"}
                          </Badge>
                          <HealthBadge status={healthByClientId[client.id] ?? "healthy"} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {entriesByClientId[client.id] ?? 0} entries
                        </span>
                        {activeDealValue > 0 && (
                          <span className="text-xs font-medium text-foreground">
                            {formatCurrency(activeDealValue)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link
            href="/dashboard/feed"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <ActivityLog entries={activityEntries} initialCount={6} />
      </div>
    </div>
  );
}
