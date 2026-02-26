"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StakeholderCard } from "@/components/dashboard/stakeholder-card";
import { StakeholderForm } from "@/components/dashboard/stakeholder-form";
import { StakeholderDetailDialog } from "@/components/dashboard/stakeholder-detail-dialog";
import { mockStakeholders } from "@/lib/mock-stakeholders";
import type { Stakeholder } from "@/lib/types";

// Grid of stakeholder cards with "Add Stakeholder" button.
// Shows key people at each client account.

interface StakeholderViewProps {
  clientId: string;
}

export function StakeholderView({ clientId }: StakeholderViewProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(
    mockStakeholders[clientId] ?? []
  );
  const [formOpen, setFormOpen] = useState(false);
  const [detailStakeholder, setDetailStakeholder] = useState<Stakeholder | null>(null);

  function handleAdd(data: Omit<Stakeholder, "id" | "touchpoints" | "last_interaction_date">) {
    const newStakeholder: Stakeholder = {
      ...data,
      id: `sh-${Date.now()}`,
      touchpoints: [],
      last_interaction_date: null,
    };
    setStakeholders((prev) => [...prev, newStakeholder]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stakeholders.length} stakeholder{stakeholders.length !== 1 ? "s" : ""} at this account
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          Add Stakeholder
        </Button>
      </div>

      {stakeholders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No stakeholders added yet. Click &ldquo;Add Stakeholder&rdquo; to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map((s) => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              onClick={() => setDetailStakeholder(s)}
            />
          ))}
        </div>
      )}

      <StakeholderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAdd}
        accountId={clientId}
      />

      <StakeholderDetailDialog
        stakeholder={detailStakeholder}
        open={!!detailStakeholder}
        onOpenChange={(open) => { if (!open) setDetailStakeholder(null); }}
      />
    </div>
  );
}
