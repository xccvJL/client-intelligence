"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Deal, DealStage } from "@/lib/types";

// Dialog form for creating or editing a deal.
// Fields: title, stage, amount, close date, notes, client.

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  defaultClientId?: string;
  deal?: (Deal & { clients?: { name: string } | null }) | null;
  onSubmit: (deal: {
    client_id: string;
    title: string;
    stage: DealStage;
    amount: number | null;
    close_date: string;
    notes: string;
  }) => void;
}

export function DealForm({
  open,
  onOpenChange,
  clients,
  defaultClientId,
  deal,
  onSubmit,
}: DealFormProps) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<DealStage>("lead");
  const [amount, setAmount] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");

  const isEditing = !!deal;

  useEffect(() => {
    if (open) {
      if (deal) {
        setTitle(deal.title);
        setStage(deal.stage);
        setAmount(deal.amount != null ? String(deal.amount) : "");
        setCloseDate(deal.close_date ?? "");
        setNotes(deal.notes ?? "");
        setClientId(deal.client_id);
      } else {
        setTitle("");
        setStage("lead");
        setAmount("");
        setCloseDate("");
        setNotes("");
        setClientId(defaultClientId ?? "");
      }
    }
  }, [open, defaultClientId, deal]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    onSubmit({
      client_id: clientId,
      title: title.trim(),
      stage,
      amount: amount ? parseFloat(amount) : null,
      close_date: closeDate,
      notes: notes.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Deal" : "Add Deal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Deal name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {!defaultClientId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="$0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Close Date</label>
            <Input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Deal notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !clientId}>
              {isEditing ? "Save Changes" : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
