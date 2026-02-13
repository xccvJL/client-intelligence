"use client";

import { useState } from "react";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { DealForm } from "@/components/dashboard/deal-form";
import type { Deal, DealStage, Client } from "@/lib/types";

// Pipeline page — kanban-style view with columns for each deal stage.
// Summary bar at top shows total pipeline value and counts.
// Click "Move to [next stage]" on a card to advance it (no drag-and-drop).

const stages: { key: DealStage; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "proposal", label: "Proposal" },
  { key: "active", label: "Active" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "2", name: "Globex Inc", domain: "globex.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "3", name: "Initech", domain: "initech.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
  { id: "4", name: "Umbrella Co", domain: "umbrella.co", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

const placeholderDeals: (Deal & { clients?: { name: string } | null })[] = [
  { id: "d1", client_id: "4", title: "Umbrella Co — Initial Assessment", stage: "lead", amount: 15000, close_date: "2026-03-15", notes: null, created_by: null, created_at: "2026-02-01", updated_at: "2026-02-01", clients: { name: "Umbrella Co" } },
  { id: "d2", client_id: "2", title: "Globex Q3 Strategy Package", stage: "proposal", amount: 45000, close_date: "2026-03-01", notes: null, created_by: null, created_at: "2026-01-15", updated_at: "2026-02-05", clients: { name: "Globex Inc" } },
  { id: "d3", client_id: "1", title: "Acme Corp — Expanded Scope", stage: "proposal", amount: 80000, close_date: "2026-04-01", notes: null, created_by: null, created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "d4", client_id: "1", title: "Acme Corp — Annual Retainer", stage: "active", amount: 120000, close_date: "2026-06-01", notes: null, created_by: null, created_at: "2025-12-01", updated_at: "2026-01-15", clients: { name: "Acme Corp" } },
  { id: "d5", client_id: "3", title: "Initech — Onboarding Support", stage: "active", amount: 25000, close_date: "2026-05-01", notes: null, created_by: null, created_at: "2026-01-20", updated_at: "2026-02-01", clients: { name: "Initech" } },
  { id: "d6", client_id: "2", title: "Globex Q1 Sprint", stage: "closed_won", amount: 30000, close_date: "2026-01-15", notes: null, created_by: null, created_at: "2025-10-01", updated_at: "2026-01-15", clients: { name: "Globex Inc" } },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PipelinePage() {
  const [deals, setDeals] = useState(placeholderDeals);
  const [formOpen, setFormOpen] = useState(false);

  function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  // Pipeline value = sum of all non-closed-lost deals
  const pipelineValue = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            Track deals from lead to close
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>Add Deal</Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline Value</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(pipelineValue)}</CardTitle>
          </CardHeader>
        </Card>
        {stages.slice(0, 3).map((s) => {
          const count = deals.filter((d) => d.stage === s.key).length;
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
          const stageDeals = deals.filter((d) => d.stage === s.key);
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

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={placeholderClients}
        onSubmit={(deal) => {
          const newDeal: Deal & { clients?: { name: string } | null } = {
            id: `d${Date.now()}`,
            ...deal,
            notes: deal.notes || null,
            amount: deal.amount,
            close_date: deal.close_date || null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            clients: placeholderClients.find((c) => c.id === deal.client_id)
              ? { name: placeholderClients.find((c) => c.id === deal.client_id)!.name }
              : null,
          };
          setDeals((prev) => [newDeal, ...prev]);
        }}
      />
    </div>
  );
}
