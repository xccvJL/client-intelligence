"use client";

import { useState } from "react";
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
import { mockStakeholders } from "@/lib/mock-stakeholders";
import type {
  Intelligence,
  ClientHealth,
  HealthAlert,
  Task,
  Deal,
} from "@/lib/types";

// Client component wrapper for the account detail tabs.
// Holds activeTab state so the Overview's "View all" links and the "More"
// dropdown can programmatically switch tabs.

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

// Placeholder data for the Overview tab — same pattern as client-health.tsx
// and client-tasks.tsx which each define their own placeholders.

const placeholderHealth: ClientHealth = {
  id: "h1",
  client_id: "1",
  status: "healthy",
  satisfaction_score: 8,
  renewal_date: "2026-06-15",
  last_positive_signal: "2026-02-10T00:00:00Z",
  last_negative_signal: null,
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-02-10",
};

const placeholderAlerts: (HealthAlert & { clients?: { name: string } | null })[] = [
  {
    id: "a1",
    client_id: "1",
    intelligence_id: "i2",
    alert_type: "risk_topic",
    severity: "warning",
    message: "Risk topics detected: capacity, concerns",
    acknowledged: false,
    created_at: "2026-02-07T00:00:00Z",
    clients: { name: "Acme Corp" },
  },
];

const placeholderTasks: (Task & { clients?: { name: string } | null })[] = [
  { id: "t1", client_id: "1", title: "Send updated SOW by Friday", description: null, status: "todo", priority: "high", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-14", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t2", client_id: "1", title: "Schedule follow-up with VP", description: null, status: "todo", priority: "medium", assignee_id: "tm2", assigned_role: null, due_date: "2026-02-18", intelligence_id: "i1", workflow_template_id: null, source: "auto", created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "t4", client_id: "1", title: "Review resource allocation", description: null, status: "done", priority: "medium", assignee_id: "tm1", assigned_role: null, due_date: "2026-02-10", intelligence_id: "i2", workflow_template_id: null, source: "auto", created_at: "2026-02-07", updated_at: "2026-02-11", clients: { name: "Acme Corp" } },
];

const placeholderDeals: (Deal & { clients?: { name: string } | null })[] = [
  { id: "d3", client_id: "1", title: "Acme Corp — Expanded Scope", stage: "proposal", amount: 80000, close_date: "2026-04-01", notes: null, created_by: null, created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "d4", client_id: "1", title: "Acme Corp — Annual Retainer", stage: "active", amount: 120000, close_date: "2026-06-01", notes: null, created_by: null, created_at: "2025-12-01", updated_at: "2026-01-15", clients: { name: "Acme Corp" } },
];

const secondaryTabs = [
  { value: "timeline", label: "Timeline" },
  { value: "people", label: "People" },
  { value: "sources", label: "Sources" },
  { value: "health", label: "Health" },
  { value: "team", label: "Team" },
];

const secondaryTabValues = new Set(secondaryTabs.map((t) => t.value));

export function AccountDetailTabs({
  clientId,
  clientName,
  intelligence,
  intelligenceForAI,
}: AccountDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const stakeholders = mockStakeholders[clientId] ?? [];
  const isSecondaryActive = secondaryTabValues.has(activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        <TabsTrigger value="deals">Deals</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="ask-ai">Ask AI</TabsTrigger>

        {/* "More" dropdown — plain button styled like a tab trigger */}
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

      {/* ── Tab content panels ── */}

      <TabsContent value="overview">
        <AccountOverview
          health={placeholderHealth}
          alerts={placeholderAlerts}
          tasks={placeholderTasks}
          intelligence={intelligence}
          deals={placeholderDeals}
          stakeholders={stakeholders}
          onTabChange={setActiveTab}
        />
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
