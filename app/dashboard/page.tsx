"use client";

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
import { useTeamContext } from "@/components/dashboard/team-context";
import type { HealthStatus, DealStage, AccountStatus } from "@/lib/types";

// Main dashboard — shows stats, account grid, pipeline snapshot,
// urgent tasks, health alerts, and recent activity.

const placeholderClients = [
  { id: "1", name: "Acme Corp", domain: "acme.com", entries: 12, tags: ["Enterprise"], health: "healthy" as HealthStatus, status: "active" as AccountStatus },
  { id: "2", name: "Globex Inc", domain: "globex.com", entries: 8, tags: ["Growth"], health: "at_risk" as HealthStatus, status: "active" as AccountStatus },
  { id: "3", name: "Initech", domain: "initech.com", entries: 5, tags: ["SMB"], health: "healthy" as HealthStatus, status: "active" as AccountStatus },
  { id: "4", name: "Umbrella Co", domain: "umbrella.co", entries: 3, tags: ["New"], health: "healthy" as HealthStatus, status: "active" as AccountStatus },
];

const placeholderActivity = [
  { id: "1", summary: "Discussed Q2 renewal timeline and expanded scope", client: "Acme Corp", source: "email", sentiment: "positive" },
  { id: "2", summary: "Budget concerns raised during quarterly review", client: "Globex Inc", source: "transcript", sentiment: "mixed" },
  { id: "3", summary: "Onboarding kickoff meeting with new stakeholders", client: "Umbrella Co", source: "transcript", sentiment: "positive" },
];

const placeholderPipelineCounts: Record<string, number> = {
  lead: 1,
  proposal: 2,
  active: 2,
  closed_won: 1,
};

const placeholderUrgentTasks = [
  { id: "t1", title: "Send updated SOW by Friday", client: "Acme Corp", priority: "high", due: "Feb 14" },
  { id: "t3", title: "Prepare quarterly budget review deck", client: "Globex Inc", priority: "high", due: "Feb 15" },
  { id: "t2", title: "Schedule follow-up with VP", client: "Acme Corp", priority: "medium", due: "Feb 18" },
];

const placeholderAlerts = [
  { id: "a1", message: "Risk topics detected: budget, concerns", client: "Globex Inc", severity: "warning" },
  { id: "a2", message: "Risk topics detected: capacity, concerns", client: "Acme Corp", severity: "warning" },
];

export default function DashboardPage() {
  const { getAccessibleClientIds, showAllAccounts } = useTeamContext();
  const accessibleIds = getAccessibleClientIds();

  // Filter to only accounts the current user can access (or all when toggle is on)
  const myClients = placeholderClients.filter((c) =>
    showAllAccounts || accessibleIds.includes(c.id)
  );
  const totalEntries = myClients.reduce((sum, c) => sum + c.entries, 0);
  const atRiskCount = myClients.filter((c) => c.health === "at_risk").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Account overview and recent intelligence
        </p>
      </div>

      {/* Stats row — expanded to 6 cards, filtered by access */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
            <CardTitle className="text-3xl">{myClients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Intelligence</CardDescription>
            <CardTitle className="text-3xl">{totalEntries}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline Value</CardDescription>
            <CardTitle className="text-2xl">$315k</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tasks</CardDescription>
            <CardTitle className="text-3xl">4</CardTitle>
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
            <CardTitle className="text-3xl">2</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pipeline Snapshot + My Tasks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Snapshot */}
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
              {(["lead", "proposal", "active", "closed_won"] as DealStage[]).map((stage) => (
                <div key={stage} className="text-center">
                  <p className="text-2xl font-bold">
                    {placeholderPipelineCounts[stage] ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {stage === "closed_won" ? "Won" : stage}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Tasks */}
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
              {placeholderUrgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.client}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {task.due}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {placeholderAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Health Alerts ({placeholderAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {placeholderAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 text-xs shrink-0"
                  >
                    !
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

      {/* Account grid — filtered by access */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {myClients.map((client) => {
            const hasAccess = accessibleIds.includes(client.id);
            return (
              <Link
                key={client.id}
                href={`/dashboard/accounts/${client.id}`}
                className={!hasAccess ? "opacity-50" : undefined}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                  {!hasAccess && (
                    <span className="absolute top-2 right-2 z-10 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      No access
                    </span>
                  )}
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
                              ? "bg-green-100 text-green-700 text-xs"
                              : "bg-gray-100 text-gray-500 text-xs"
                          }
                        >
                          {client.status === "active" ? "Active" : "Archived"}
                        </Badge>
                        <HealthBadge status={client.health} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {client.entries} entries
                      </span>
                      <div className="flex gap-1">
                        {client.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
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
        <div className="space-y-3">
          {placeholderActivity.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.summary}</CardTitle>
                    <CardDescription>
                      {item.client} &middot;{" "}
                      {item.source === "email" ? "Email" : "Transcript"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      item.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : item.sentiment === "mixed"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {item.sentiment}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
