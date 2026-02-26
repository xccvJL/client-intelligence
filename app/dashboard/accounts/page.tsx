"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { AccountCard } from "@/components/dashboard/account-card";
import { PipelineColumn } from "@/components/dashboard/pipeline-column";
import { DealForm } from "@/components/dashboard/deal-form";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Deal, DealStage, Client, HealthAlert, HealthStatus, Intelligence } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const stages: { key: DealStage; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "proposal", label: "Proposal" },
  { key: "active", label: "Active" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

type DealWithClient = Deal & { clients?: { name: string } | null };
type StatusFilter = "all" | "active" | "archived";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AccountsPage() {
  const { getRequestHeaders } = useTeamContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<DealWithClient[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountDomain, setNewAccountDomain] = useState("");

  const entriesByClientId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of intelligence) {
      if (!entry.client_id) continue;
      counts.set(entry.client_id, (counts.get(entry.client_id) ?? 0) + 1);
    }
    return counts;
  }, [intelligence]);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const healthByClientId = useMemo(() => {
    const map = new Map<string, HealthStatus>();
    for (const client of clients) {
      map.set(client.id, client.status === "archived" ? "churning" : "healthy");
    }
    for (const alert of alerts) {
      if (alert.severity === "critical") {
        map.set(alert.client_id, "churning");
      } else if (map.get(alert.client_id) !== "churning") {
        map.set(alert.client_id, "at_risk");
      }
    }
    return map;
  }, [clients, alerts]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const [clientsRes, dealsRes, alertsRes, intelRes] = await Promise.all([
          fetch("/api/clients", { headers: getRequestHeaders() }),
          fetch("/api/deals", { headers: getRequestHeaders() }),
          fetch("/api/alerts?acknowledged=false", { headers: getRequestHeaders() }),
          fetch("/api/intelligence?per_page=100&page=1", { headers: getRequestHeaders() }),
        ]);

        const clientsJson = (await clientsRes.json()) as { data?: Client[]; error?: string };
        const dealsJson = (await dealsRes.json()) as { data?: DealWithClient[]; error?: string };
        const alertsJson = (await alertsRes.json()) as { data?: HealthAlert[]; error?: string };
        const intelJson = (await intelRes.json()) as { data?: Intelligence[]; error?: string };

        if (!clientsRes.ok) throw new Error(clientsJson.error ?? "Failed to load accounts");
        if (!dealsRes.ok) throw new Error(dealsJson.error ?? "Failed to load deals");
        if (!alertsRes.ok) throw new Error(alertsJson.error ?? "Failed to load alerts");
        if (!intelRes.ok) throw new Error(intelJson.error ?? "Failed to load intelligence");

        setClients(clientsJson.data ?? []);
        setDeals(dealsJson.data ?? []);
        setAlerts(alertsJson.data ?? []);
        setIntelligence(intelJson.data ?? []);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load accounts");
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
      if (!res.ok || !json.data) throw new Error(json.error ?? "Failed to update deal");

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
      setPageError(error instanceof Error ? error.message : "Failed to update deal");
    }
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
    const optimistic: DealWithClient = {
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
    setDeals((prev) => [optimistic, ...prev]);

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
      if (!res.ok || !json.data) throw new Error(json.error ?? "Failed to create deal");

      setDeals((prev) =>
        prev.map((item) =>
          item.id === optimisticId
            ? {
                ...json.data!,
                clients: {
                  name:
                    clientNameById.get(json.data!.client_id) ??
                    optimistic.clients?.name ??
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
  }

  async function handleCreateAccount() {
    if (!newAccountName.trim() || !newAccountDomain.trim()) return;
    setPageError(null);

    const optimisticId = `client-optimistic-${Date.now()}`;
    const optimistic: Client = {
      id: optimisticId,
      name: newAccountName.trim(),
      domain: newAccountDomain.trim(),
      contacts: [],
      tags: [],
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setClients((prev) => [optimistic, ...prev]);
    setCreateAccountOpen(false);
    setNewAccountName("");
    setNewAccountDomain("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({
          name: optimistic.name,
          domain: optimistic.domain,
          contacts: [],
          tags: [],
        }),
      });
      const json = (await res.json()) as { data?: Client; error?: string };
      if (!res.ok || !json.data) throw new Error(json.error ?? "Failed to create account");

      setClients((prev) =>
        prev.map((client) => (client.id === optimisticId ? json.data! : client))
      );
    } catch (error) {
      setClients((prev) => prev.filter((client) => client.id !== optimisticId));
      setPageError(error instanceof Error ? error.message : "Failed to create account");
    }
  }

  const filteredAccounts = clients.filter((client) => {
    if (statusFilter === "all") return true;
    return client.status === statusFilter;
  });

  const pipelineValue = deals
    .filter((deal) => deal.stage !== "closed_lost")
    .reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage accounts and track deals through the pipeline
          </p>
        </div>
        <Button onClick={() => setCreateAccountOpen(true)}>Add Account</Button>
      </div>

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      ) : (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">All Accounts</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => {
                const accountDeals = deals.filter((deal) => deal.client_id === account.id);
                const activeDealValue = accountDeals
                  .filter((deal) => deal.stage !== "closed_lost")
                  .reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

                return (
                  <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
                    <AccountCard
                      name={account.name}
                      domain={account.domain}
                      status={account.status}
                      healthStatus={healthByClientId.get(account.id)}
                      dealValue={activeDealValue}
                    />
                    <div className="mt-1 px-1 text-xs text-muted-foreground">
                      {entriesByClientId.get(account.id) ?? 0} intelligence entries
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

          <TabsContent value="pipeline" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
      )}

      <DealForm
        open={dealFormOpen}
        onOpenChange={setDealFormOpen}
        clients={clients}
        onSubmit={(deal) => {
          void handleCreateDeal(deal);
        }}
      />

      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Domain</label>
              <Input
                value={newAccountDomain}
                onChange={(e) => setNewAccountDomain(e.target.value)}
                placeholder="acme.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAccountOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleCreateAccount();
              }}
              disabled={!newAccountName.trim() || !newAccountDomain.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Alerts</h2>
        <Card>
          <CardContent className="pt-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 8).map((alert) => (
                  <div key={alert.id} className="rounded-md border px-3 py-2 text-sm">
                    <p>{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {clientNameById.get(alert.client_id) ?? "Unknown account"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
