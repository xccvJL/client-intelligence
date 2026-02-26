"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { AccountCard } from "@/components/dashboard/account-card";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { DealForm } from "@/components/dashboard/deal-form";
import { BulkActionBar } from "@/components/dashboard/bulk-action-bar";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Deal, DealStage, Client, HealthStatus } from "@/lib/types";

// Accounts page — combines the account list and pipeline kanban into one view.
// "All Accounts" tab: filterable card grid (All / Active / Archived).
// "Pipeline" tab: kanban board with deal stage columns.

const stages: { key: DealStage; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "proposal", label: "Proposal" },
  { key: "active", label: "Active" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

const placeholderClients: (Client & { health: HealthStatus })[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", health: "healthy", created_at: "", updated_at: "" },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: [], tags: [], status: "active", health: "at_risk", created_at: "", updated_at: "" },
  { id: "3", name: "Initech", domain: "initech.com", contacts: [], tags: [], status: "active", health: "healthy", created_at: "", updated_at: "" },
  { id: "4", name: "Umbrella Co", domain: "umbrella.co", contacts: [], tags: [], status: "active", health: "healthy", created_at: "", updated_at: "" },
  { id: "5", name: "Waystar Royco", domain: "waystar.com", contacts: [], tags: [], status: "archived", health: "churning", created_at: "", updated_at: "" },
];

const placeholderDeals: (Deal & { clients?: { name: string } | null })[] = [
  { id: "d1", client_id: "4", title: "Umbrella Co — Initial Assessment", stage: "lead", amount: 15000, close_date: "2026-03-15", notes: null, created_by: null, created_at: "2026-02-01", updated_at: "2026-02-01", clients: { name: "Umbrella Co" } },
  { id: "d2", client_id: "2", title: "Globex Q3 Strategy Package", stage: "proposal", amount: 45000, close_date: "2026-03-01", notes: null, created_by: null, created_at: "2026-01-15", updated_at: "2026-02-05", clients: { name: "Globex Inc" } },
  { id: "d3", client_id: "1", title: "Acme Corp — Expanded Scope", stage: "proposal", amount: 80000, close_date: "2026-04-01", notes: null, created_by: null, created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "d4", client_id: "1", title: "Acme Corp — Annual Retainer", stage: "active", amount: 120000, close_date: "2026-06-01", notes: null, created_by: null, created_at: "2025-12-01", updated_at: "2026-01-15", clients: { name: "Acme Corp" } },
  { id: "d5", client_id: "3", title: "Initech — Onboarding Support", stage: "active", amount: 25000, close_date: "2026-05-01", notes: null, created_by: null, created_at: "2026-01-20", updated_at: "2026-02-01", clients: { name: "Initech" } },
  { id: "d6", client_id: "2", title: "Globex Q1 Sprint", stage: "closed_won", amount: 30000, close_date: "2026-01-15", notes: null, created_by: null, created_at: "2025-10-01", updated_at: "2026-01-15", clients: { name: "Globex Inc" } },
  { id: "d7", client_id: "5", title: "Waystar — Brand Audit", stage: "closed_lost", amount: 50000, close_date: "2026-01-10", notes: null, created_by: null, created_at: "2025-11-01", updated_at: "2026-01-10", clients: { name: "Waystar Royco" } },
];

type StatusFilter = "all" | "active" | "archived";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AccountsPage() {
  const [localDeals, setLocalDeals] = useState(placeholderDeals);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(new Set());
  const { getAccessibleClientIds, showAllAccounts, incomingLeads } = useTeamContext();

  // Convert incoming leads into the same shape as our placeholder data
  const leadClients: (Client & { health: HealthStatus })[] = incomingLeads.map((l) => ({
    ...l.client,
    health: "healthy" as const,
  }));
  const leadDeals: (Deal & { clients?: { name: string } | null })[] = incomingLeads.map((l) => l.deal);

  // Merge placeholder + incoming leads
  const allClients = [...placeholderClients, ...leadClients];
  const deals = [...localDeals, ...leadDeals];

  // Only show accounts (and their deals) that the current user has access to
  const accessibleIds = getAccessibleClientIds();

  function handleStageChange(dealId: string, newStage: DealStage) {
    setLocalDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  // Get deals for an account and compute summary info
  function getAccountDeals(clientId: string) {
    return deals.filter((d) => d.client_id === clientId);
  }

  // Filter accounts by access + status
  const filteredAccounts = allClients.filter((c) => {
    if (!showAllAccounts && !accessibleIds.includes(c.id)) return false;
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  // Include deals for accessible accounts (or all when toggle is on)
  const accessibleDeals = deals.filter((d) =>
    showAllAccounts || accessibleIds.includes(d.client_id)
  );

  // Pipeline value = sum of all non-closed-lost accessible deals
  const pipelineValue = accessibleDeals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage accounts and track deals through the pipeline
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>Add Account</Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All Accounts</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        {/* ── All Accounts tab ── */}
        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Status filter buttons */}
          <div className="flex gap-2">
            {(["all", "active", "archived"] as StatusFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className="capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Account cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => {
              const accountDeals = getAccountDeals(account.id);
              const activeDealValue = accountDeals
                .filter((d) => d.stage !== "closed_lost")
                .reduce((sum, d) => sum + (d.amount ?? 0), 0);
              const hasAccess = accessibleIds.includes(account.id);

              return (
                <Link
                  key={account.id}
                  href={`/dashboard/accounts/${account.id}`}
                  className={!hasAccess ? "opacity-50" : undefined}
                >
                  <div className="relative">
                    {!hasAccess && (
                      <span className="absolute top-2 right-2 z-10 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                        No access
                      </span>
                    )}
                    <AccountCard
                      name={account.name}
                      domain={account.domain}
                      status={account.status}
                      healthStatus={account.health}
                      dealValue={activeDealValue}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No {statusFilter !== "all" ? statusFilter : ""} accounts found
            </p>
          )}
        </TabsContent>

        {/* ── Pipeline tab ── */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pipeline Value</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(pipelineValue)}</CardTitle>
              </CardHeader>
            </Card>
            {stages.slice(0, 3).map((s) => {
              const count = accessibleDeals.filter((d) => d.stage === s.key).length;
              return (
                <Card key={s.key}>
                  <CardHeader className="pb-2">
                    <CardDescription>{s.label}</CardDescription>
                    <CardTitle className="text-2xl">{count}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Kanban columns */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((s) => {
              const stageDeals = accessibleDeals.filter((d) => d.stage === s.key);
              const stageValue = stageDeals.reduce(
                (sum, d) => sum + (d.amount ?? 0),
                0
              );
              return (
                <PipelineColumn
                  key={s.key}
                  stage={s.key}
                  label={s.label}
                  deals={stageDeals}
                  totalValue={stageValue}
                  onStageChange={handleStageChange}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk action bar for selected deals */}
      <BulkActionBar
        selectedCount={selectedDealIds.size}
        onDelete={() => {
          setLocalDeals((prev) => prev.filter((d) => !selectedDealIds.has(d.id)));
          setSelectedDealIds(new Set());
        }}
        onClearSelection={() => setSelectedDealIds(new Set())}
        actions={[
          {
            label: "Move to Active",
            onClick: () => {
              setLocalDeals((prev) =>
                prev.map((d) => selectedDealIds.has(d.id) ? { ...d, stage: "active" as DealStage } : d)
              );
              setSelectedDealIds(new Set());
            },
          },
        ]}
      />

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={allClients}
        onSubmit={(deal) => {
          const matchedClient = allClients.find((c) => c.id === deal.client_id);
          const newDeal: Deal & { clients?: { name: string } | null } = {
            id: `d${Date.now()}`,
            ...deal,
            notes: deal.notes || null,
            amount: deal.amount,
            close_date: deal.close_date || null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            clients: matchedClient ? { name: matchedClient.name } : null,
          };
          setLocalDeals((prev) => [newDeal, ...prev]);
        }}
      />
    </div>
  );
}
