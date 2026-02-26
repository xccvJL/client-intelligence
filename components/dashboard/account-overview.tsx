"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "./health-badge";
import { AlertCard } from "./alert-card";
import type {
  ClientHealth,
  HealthAlert,
  Task,
  Deal,
  Stakeholder,
  StakeholderRole,
  TaskPriority,
} from "@/lib/types";

// Overview tab — shows "what needs attention right now" on one screen.
// Each summary card has a "View all" link that switches to the full tab.

interface IntelligenceEntry {
  id: string;
  summary: string;
  source: string;
  sentiment: string;
  date: string;
  topics: string[];
  actionItems: string[];
}

interface AccountOverviewProps {
  health: ClientHealth;
  alerts: (HealthAlert & { clients?: { name: string } | null })[];
  tasks: (Task & { clients?: { name: string } | null })[];
  intelligence: IntelligenceEntry[];
  deals: (Deal & { clients?: { name: string } | null })[];
  stakeholders: Stakeholder[];
  onTabChange: (tab: string) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const roleConfig: Record<StakeholderRole, { label: string; className: string }> = {
  decision_maker: { label: "Decision Maker", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  champion: { label: "Champion", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  blocker: { label: "Blocker", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  influencer: { label: "Influencer", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  end_user: { label: "End User", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function ViewAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      View all &rarr;
    </button>
  );
}

export function AccountOverview({
  health,
  alerts,
  tasks,
  intelligence,
  deals,
  stakeholders,
  onTabChange,
}: AccountOverviewProps) {
  const [referenceNowMs] = useState(() => Date.now());
  const renewalCountdown = health.renewal_date
    ? Math.ceil(
        (new Date(health.renewal_date).getTime() - referenceNowMs) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const openTasks = tasks.filter((t) => t.status !== "done").slice(0, 3);
  const latestIntel = intelligence.slice(0, 2);
  const activeDeals = deals.filter((d) => d.stage !== "closed_lost");
  const totalDealValue = activeDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const topStakeholders = stakeholders.slice(0, 3);

  function getSourceLabel(source: string) {
    const normalized = source.trim().toLowerCase();
    if (normalized === "email" || normalized === "gmail") return "Email";
    if (
      normalized === "transcript" ||
      normalized === "google_drive" ||
      normalized === "drive"
    ) {
      return "Transcript";
    }
    if (normalized === "manual_note" || normalized === "note") return "Note";
    return source;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Health */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Health</CardTitle>
            <div className="flex items-center gap-2">
              <HealthBadge status={health.status} />
              <ViewAllButton onClick={() => onTabChange("health")} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p>Satisfaction: <span className="font-medium">{health.satisfaction_score}/10</span></p>
            {renewalCountdown !== null && (
              <p className={renewalCountdown <= 30 ? "text-red-600 font-medium" : ""}>
                Renewal: {renewalCountdown > 0 ? `${renewalCountdown} days away` : "Past due"}
              </p>
            )}
            {health.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                {health.notes}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              <div>
                <p>Last positive signal</p>
                <p className="text-foreground">
                  {health.last_positive_signal
                    ? new Date(health.last_positive_signal).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "None"}
                </p>
              </div>
              <div>
                <p>Last negative signal</p>
                <p className="text-foreground">
                  {health.last_negative_signal
                    ? new Date(health.last_negative_signal).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "None"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts — only shown if there are unacknowledged alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Alerts ({unacknowledgedAlerts.length})
              </CardTitle>
              <ViewAllButton onClick={() => onTabChange("health")} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Tasks */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Open Tasks</CardTitle>
            <ViewAllButton onClick={() => onTabChange("tasks")} />
          </div>
        </CardHeader>
        <CardContent>
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks</p>
          ) : (
            <div className="space-y-2">
              {openTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className={`${priorityColors[task.priority]} text-xs shrink-0`}>
                    {task.priority}
                  </Badge>
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Intelligence */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Latest Intelligence</CardTitle>
            <ViewAllButton onClick={() => onTabChange("intelligence")} />
          </div>
        </CardHeader>
        <CardContent>
          {latestIntel.length === 0 ? (
            <p className="text-sm text-muted-foreground">No intelligence yet</p>
          ) : (
            <div className="space-y-3">
              {latestIntel.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        item.sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.sentiment}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getSourceLabel(item.source)} &middot; {item.date}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{item.summary}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Deals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Deals</CardTitle>
            <ViewAllButton onClick={() => onTabChange("deals")} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">{activeDeals.length}</span> active deal{activeDeals.length !== 1 ? "s" : ""}</p>
            {totalDealValue > 0 && (
              <p className="text-lg font-semibold">{formatCurrency(totalDealValue)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key People */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Key People</CardTitle>
            <ViewAllButton onClick={() => onTabChange("people")} />
          </div>
        </CardHeader>
        <CardContent>
          {topStakeholders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stakeholders added</p>
          ) : (
            <div className="space-y-2">
              {topStakeholders.map((s) => {
                const role = roleConfig[s.role];
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{s.name}</span>
                    <span className="text-muted-foreground truncate">{s.job_title}</span>
                    <Badge variant="secondary" className={`${role.className} text-xs shrink-0 ml-auto`}>
                      {role.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
