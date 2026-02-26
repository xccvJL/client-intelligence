"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DealCard } from "./deal-card";
import { DealForm } from "./deal-form";
import { DealDetailDialog } from "./deal-detail-dialog";
import { useTeamContext } from "./team-context";
import type { Deal, DealStage, Client } from "@/lib/types";

// Shows deals for a specific client inside the client detail page.

interface ClientDealsProps {
  clientId: string;
}

type DealWithClient = Deal & { clients?: { name: string } | null };

export function ClientDeals({ clientId }: ClientDealsProps) {
  const { getRequestHeaders } = useTeamContext();
  const [deals, setDeals] = useState<DealWithClient[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState<DealWithClient | null>(null);
  const [editingDeal, setEditingDeal] = useState<DealWithClient | null>(null);

  const formClients = useMemo(() => (client ? [client] : []), [client]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);

      try {
        const [dealsRes, clientRes] = await Promise.all([
          fetch(`/api/deals?client_id=${clientId}`, { headers: getRequestHeaders() }),
          fetch(`/api/clients/${clientId}`, { headers: getRequestHeaders() }),
        ]);

        const dealsJson = (await dealsRes.json()) as { data?: DealWithClient[]; error?: string };
        const clientJson = (await clientRes.json()) as { data?: Client; error?: string };

        if (!dealsRes.ok) {
          throw new Error(dealsJson.error ?? "Failed to load deals");
        }
        if (!clientRes.ok) {
          throw new Error(clientJson.error ?? "Failed to load account details");
        }

        setDeals(dealsJson.data ?? []);
        setClient(clientJson.data ?? null);
      } catch (error) {
        setDeals([]);
        setClient(null);
        setPageError(error instanceof Error ? error.message : "Failed to load deals");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [clientId, getRequestHeaders]);

  async function patchDeal(dealId: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getRequestHeaders(),
      },
      body: JSON.stringify(updates),
    });

    const json = (await res.json()) as { data?: Deal; error?: string };
    if (!res.ok || !json.data) {
      throw new Error(json.error ?? "Failed to update deal");
    }

    return json.data;
  }

  function withClientName(deal: Deal): DealWithClient {
    return {
      ...deal,
      clients: {
        name: client?.name ?? "Unknown",
      },
    };
  }

  function handleStageChange(dealId: string, newStage: DealStage) {
    setPageError(null);
    const previous = deals;

    setDeals((prev) =>
      prev.map((deal) => (deal.id === dealId ? { ...deal, stage: newStage } : deal))
    );

    void (async () => {
      try {
        const updated = await patchDeal(dealId, { stage: newStage });
        setDeals((prev) =>
          prev.map((deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  ...updated,
                  clients: deal.clients ?? { name: client?.name ?? "Unknown" },
                }
              : deal
          )
        );
      } catch (error) {
        setDeals(previous);
        setPageError(error instanceof Error ? error.message : "Failed to move deal");
      }
    })();
  }

  async function handleCreateDeal(deal: {
    client_id: string;
    title: string;
    stage: DealStage;
    amount: number | null;
    close_date: string;
    notes: string;
  }) {
    setPageError(null);

    const optimisticId = `deal-optimistic-${Date.now()}`;
    const optimisticDeal: DealWithClient = {
      id: optimisticId,
      client_id: deal.client_id,
      title: deal.title,
      stage: deal.stage,
      amount: deal.amount,
      close_date: deal.close_date || null,
      notes: deal.notes || null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: { name: client?.name ?? "Unknown" },
    };

    setDeals((prev) => [optimisticDeal, ...prev]);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify(deal),
      });

      const json = (await res.json()) as { data?: Deal; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to create deal");
      }

      setDeals((prev) =>
        prev.map((item) =>
          item.id === optimisticId ? withClientName(json.data!) : item
        )
      );
    } catch (error) {
      setDeals((prev) => prev.filter((item) => item.id !== optimisticId));
      setPageError(error instanceof Error ? error.message : "Failed to create deal");
    }
  }

  async function handleUpdateDeal(
    dealId: string,
    updates: {
      client_id: string;
      title: string;
      stage: DealStage;
      amount: number | null;
      close_date: string;
      notes: string;
    }
  ) {
    setPageError(null);
    const previous = deals;

    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              ...updates,
              close_date: updates.close_date || null,
              notes: updates.notes || null,
              clients: deal.clients ?? { name: client?.name ?? "Unknown" },
            }
          : deal
      )
    );

    try {
      const updated = await patchDeal(dealId, {
        title: updates.title,
        stage: updates.stage,
        amount: updates.amount,
        close_date: updates.close_date || null,
        notes: updates.notes || null,
      });
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                ...updated,
                clients: deal.clients ?? { name: client?.name ?? "Unknown" },
              }
            : deal
        )
      );
    } catch (error) {
      setDeals(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update deal");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading deals...</p>;
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

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

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
              onClick={(selectedDeal) => setDetailDeal(selectedDeal)}
            />
          ))
        )}
      </div>

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={formClients}
        defaultClientId={clientId}
        onSubmit={(deal) => {
          void handleCreateDeal(deal);
        }}
      />

      {detailDeal && (
        <DealDetailDialog
          open={!!detailDeal}
          onOpenChange={(open) => {
            if (!open) setDetailDeal(null);
          }}
          deal={detailDeal}
          onEdit={() => {
            setEditingDeal(detailDeal);
            setDetailDeal(null);
          }}
        />
      )}

      <DealForm
        open={!!editingDeal}
        onOpenChange={(open) => {
          if (!open) setEditingDeal(null);
        }}
        clients={formClients}
        defaultClientId={clientId}
        deal={editingDeal}
        onSubmit={(updatedDeal) => {
          if (!editingDeal) return;
          void handleUpdateDeal(editingDeal.id, updatedDeal);
          setEditingDeal(null);
        }}
      />
    </div>
  );
}
