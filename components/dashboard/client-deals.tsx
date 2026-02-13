"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DealCard } from "./deal-card";
import { DealForm } from "./deal-form";
import type { Deal, DealStage, Client } from "@/lib/types";

// Shows deals for a specific client inside the client detail page.
// Includes stage-change buttons and an "Add Deal" button.

interface ClientDealsProps {
  clientId: string;
}

const placeholderClients: Client[] = [
  { id: "1", name: "Acme Corp", domain: "acme.com", contacts: [], tags: [], status: "active", created_at: "", updated_at: "" },
];

const placeholderDeals: (Deal & { clients?: { name: string } | null })[] = [
  { id: "d3", client_id: "1", title: "Acme Corp — Expanded Scope", stage: "proposal", amount: 80000, close_date: "2026-04-01", notes: null, created_by: null, created_at: "2026-02-10", updated_at: "2026-02-10", clients: { name: "Acme Corp" } },
  { id: "d4", client_id: "1", title: "Acme Corp — Annual Retainer", stage: "active", amount: 120000, close_date: "2026-06-01", notes: null, created_by: null, created_at: "2025-12-01", updated_at: "2026-01-15", clients: { name: "Acme Corp" } },
];

export function ClientDeals({ clientId }: ClientDealsProps) {
  const [deals, setDeals] = useState(placeholderDeals);
  const [formOpen, setFormOpen] = useState(false);

  function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {deals.length} deal{deals.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          Add Deal
        </Button>
      </div>

      <div className="space-y-2">
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No deals for this account yet
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onStageChange={handleStageChange}
            />
          ))
        )}
      </div>

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={placeholderClients}
        defaultClientId={clientId}
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
            clients: null,
          };
          setDeals((prev) => [newDeal, ...prev]);
        }}
      />
    </div>
  );
}
