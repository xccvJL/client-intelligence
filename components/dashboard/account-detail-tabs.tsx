"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ClientSourceOverrides } from "@/components/dashboard/client-source-overrides";
import { ClientTasks } from "@/components/dashboard/client-tasks";
import { ClientDeals } from "@/components/dashboard/client-deals";
import { ClientHealthTab } from "@/components/dashboard/client-health";
import { AccountMembers } from "@/components/dashboard/account-members";
import { AccountBrief } from "@/components/dashboard/account-brief";
import { AccountChat } from "@/components/dashboard/account-chat";
import { ClientIntelligence } from "@/components/dashboard/client-intelligence";
import { ClientTimeline } from "@/components/dashboard/client-timeline";
import { StakeholderView } from "@/components/dashboard/stakeholder-view";
import { CalendarPreview } from "@/components/dashboard/calendar-preview";
import { AccountOverview } from "@/components/dashboard/account-overview";
import { useTeamContext } from "@/components/dashboard/team-context";
import type {
  Intelligence,
  ClientHealth,
  HealthAlert,
  Task,
  Deal,
  Stakeholder,
} from "@/lib/types";

// Client component wrapper for the account detail tabs.

interface IntelligenceEntry {
  id: string;
  summary: string;
  source: string;
  sentiment: string;
  date: string;
  topics: string[];
  actionItems: string[];
}

interface AccountDetailTabsProps {
  clientId: string;
  clientName: string;
  intelligence: IntelligenceEntry[];
  intelligenceForAI: Intelligence[];
}

const secondaryTabs = [
  { value: "timeline", label: "Timeline" },
  { value: "people", label: "People" },
  { value: "sources", label: "Sources" },
  { value: "health", label: "Health" },
  { value: "team", label: "Team" },
];

const secondaryTabValues = new Set(secondaryTabs.map((tab) => tab.value));

function createDefaultHealth(clientId: string): ClientHealth {
  const timestamp = new Date().toISOString();
  return {
    id: `health-${clientId}`,
    client_id: clientId,
    status: "healthy",
    satisfaction_score: 7,
    renewal_date: null,
    last_positive_signal: null,
    last_negative_signal: null,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function normalizeHealth(clientId: string, health?: Partial<ClientHealth> | null): ClientHealth {
  const fallback = createDefaultHealth(clientId);
  if (!health) return fallback;

  return {
    ...fallback,
    ...health,
    id: health.id ?? fallback.id,
    client_id: health.client_id ?? fallback.client_id,
    created_at: health.created_at ?? fallback.created_at,
    updated_at: health.updated_at ?? fallback.updated_at,
  };
}

export function AccountDetailTabs({
  clientId,
  clientName,
  intelligence,
  intelligenceForAI,
}: AccountDetailTabsProps) {
  const { getRequestHeaders } = useTeamContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [health, setHealth] = useState<ClientHealth>(createDefaultHealth(clientId));
  const [alerts, setAlerts] = useState<(HealthAlert & { clients?: { name: string } | null })[]>([]);
  const [tasks, setTasks] = useState<(Task & { clients?: { name: string } | null })[]>([]);
  const [deals, setDeals] = useState<(Deal & { clients?: { name: string } | null })[]>([]);

  const stakeholders: Stakeholder[] = [];
  const isSecondaryActive = secondaryTabValues.has(activeTab);

  useEffect(() => {
    async function loadOverviewData() {
      setOverviewLoading(true);
      setOverviewError(null);

      try {
        const [healthRes, alertsRes, tasksRes, dealsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/health`, { headers: getRequestHeaders() }),
          fetch(`/api/alerts?client_id=${clientId}&acknowledged=false`, {
            headers: getRequestHeaders(),
          }),
          fetch(`/api/tasks?client_id=${clientId}`, { headers: getRequestHeaders() }),
          fetch(`/api/deals?client_id=${clientId}`, { headers: getRequestHeaders() }),
        ]);

        const healthJson = (await healthRes.json()) as { data?: Partial<ClientHealth>; error?: string };
        const alertsJson = (await alertsRes.json()) as {
          data?: (HealthAlert & { clients?: { name: string } | null })[];
          error?: string;
        };
        const tasksJson = (await tasksRes.json()) as {
          data?: (Task & { clients?: { name: string } | null })[];
          error?: string;
        };
        const dealsJson = (await dealsRes.json()) as {
          data?: (Deal & { clients?: { name: string } | null })[];
          error?: string;
        };

        if (!healthRes.ok) {
          throw new Error(healthJson.error ?? "Failed to load health");
        }
        if (!alertsRes.ok) {
          throw new Error(alertsJson.error ?? "Failed to load alerts");
        }
        if (!tasksRes.ok) {
          throw new Error(tasksJson.error ?? "Failed to load tasks");
        }
        if (!dealsRes.ok) {
          throw new Error(dealsJson.error ?? "Failed to load deals");
        }

        setHealth(normalizeHealth(clientId, healthJson.data));
        setAlerts(alertsJson.data ?? []);
        setTasks(tasksJson.data ?? []);
        setDeals(dealsJson.data ?? []);
      } catch (error) {
        setOverviewError(
          error instanceof Error ? error.message : "Failed to load account overview"
        );
        setHealth(createDefaultHealth(clientId));
        setAlerts([]);
        setTasks([]);
        setDeals([]);
      } finally {
        setOverviewLoading(false);
      }
    }

    void loadOverviewData();
  }, [clientId, getRequestHeaders]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        <TabsTrigger value="deals">Deals</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="ask-ai">Ask AI</TabsTrigger>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1 focus-visible:outline-ring ${
                isSecondaryActive
                  ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
                  : "text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
              }`}
            >
              More
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60">
                <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryTabs.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={activeTab === tab.value ? "bg-accent" : ""}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsList>

      <TabsContent value="overview">
        {overviewLoading ? (
          <p className="text-sm text-muted-foreground mt-4">Loading overview...</p>
        ) : (
          <div className="space-y-3 mt-4">
            {overviewError && <p className="text-sm text-destructive">{overviewError}</p>}
            <AccountOverview
              health={health}
              alerts={alerts}
              tasks={tasks}
              intelligence={intelligence}
              deals={deals}
              stakeholders={stakeholders}
              onTabChange={setActiveTab}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="intelligence" className="space-y-4 mt-4">
        <p className="text-sm text-muted-foreground">
          {intelligence.length} entries (Account ID: {clientId})
        </p>
        <ClientIntelligence
          clientId={clientId}
          clientName={clientName}
          entries={intelligence}
          intelligence={intelligenceForAI}
        />
      </TabsContent>

      <TabsContent value="deals" className="mt-4">
        <ClientDeals clientId={clientId} />
      </TabsContent>

      <TabsContent value="tasks" className="mt-4">
        <ClientTasks clientId={clientId} />
      </TabsContent>

      <TabsContent value="brief" className="mt-4">
        <AccountBrief clientId={clientId} clientName={clientName} intelligence={intelligenceForAI} />
      </TabsContent>

      <TabsContent value="ask-ai" className="mt-4">
        <AccountChat clientId={clientId} intelligence={intelligenceForAI} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <ClientTimeline clientId={clientId} />
      </TabsContent>

      <TabsContent value="people" className="mt-4">
        <StakeholderView clientId={clientId} />
      </TabsContent>

      <TabsContent value="sources" className="mt-4">
        <ClientSourceOverrides clientId={clientId} />
      </TabsContent>

      <TabsContent value="health" className="space-y-6 mt-4">
        <ClientHealthTab clientId={clientId} clientName={clientName} intelligence={intelligenceForAI} />
        <CalendarPreview accountId={clientId} />
      </TabsContent>

      <TabsContent value="team" className="mt-4">
        <AccountMembers clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
}
