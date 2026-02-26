"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { DealForm } from "@/components/dashboard/deal-form";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Deal, DealStage, Client } from "@/lib/types";

const stages: { key: DealStage; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "proposal", label: "Proposal" },
  { key: "active", label: "Active" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

type DealWithClient = Deal & { clients?: { name: string } | null };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PipelinePage() {
  const { getRequestHeaders } = useTeamContext();
  const [deals, setDeals] = useState<DealWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const [dealsRes, clientsRes] = await Promise.all([
          fetch("/api/deals", { headers: getRequestHeaders() }),
          fetch("/api/clients?status=active", { headers: getRequestHeaders() }),
        ]);

        const dealsJson = (await dealsRes.json()) as { data?: DealWithClient[]; error?: string };
        const clientsJson = (await clientsRes.json()) as { data?: Client[]; error?: string };

        if (!dealsRes.ok) throw new Error(dealsJson.error ?? "Failed to load deals");
        if (!clientsRes.ok) throw new Error(clientsJson.error ?? "Failed to load clients");

        setDeals(dealsJson.data ?? []);
        setClients(clientsJson.data ?? []);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load pipeline");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [getRequestHeaders]);

  async function handleStageChange(dealId: string, newStage: DealStage) {
    setPageError(null);
    const previous = deals;
    setDeals((prev) =>
      prev.map((deal) => (deal.id === dealId ? { ...deal, stage: newStage } : deal))
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = (await res.json()) as { data?: Deal; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to move deal");
      }

      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                ...json.data!,
                clients: deal.clients ?? {
                  name: clientNameById.get(json.data!.client_id) ?? "Unknown",
                },
              }
            : deal
        )
      );
    } catch (error) {
      setDeals(previous);
      setPageError(error instanceof Error ? error.message : "Failed to move deal");
    }
  }

  const pipelineValue = deals
    .filter((deal) => deal.stage !== "closed_lost")
    .reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

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

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pipeline...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pipeline Value</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(pipelineValue)}</CardTitle>
              </CardHeader>
            </Card>
            {stages.slice(0, 3).map((stage) => {
              const count = deals.filter((deal) => deal.stage === stage.key).length;
              return (
                <Card key={stage.key}>
                  <CardHeader className="pb-2">
                    <CardDescription>{stage.label}</CardDescription>
                    <CardTitle className="text-2xl">{count}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage.key);
              const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
              return (
                <PipelineColumn
                  key={stage.key}
                  stage={stage.key}
                  label={stage.label}
                  deals={stageDeals}
                  totalValue={stageValue}
                  onStageChange={handleStageChange}
                />
              );
            })}
          </div>
        </>
      )}

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={clients}
        onSubmit={(deal) => {
          void (async () => {
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
              clients: { name: clientNameById.get(deal.client_id) ?? "Unknown" },
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
                  item.id === optimisticId
                    ? {
                        ...json.data!,
                        clients: {
                          name:
                            clientNameById.get(json.data!.client_id) ??
                            optimisticDeal.clients?.name ??
                            "Unknown",
                        },
                      }
                    : item
                )
              );
            } catch (error) {
              setDeals((prev) => prev.filter((item) => item.id !== optimisticId));
              setPageError(error instanceof Error ? error.message : "Failed to create deal");
            }
          })();
        }}
      />
    </div>
  );
}
