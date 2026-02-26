"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Stakeholder, StakeholderRole } from "@/lib/types";

// Dialog form for adding or editing a stakeholder.

const roleOptions: { value: StakeholderRole; label: string }[] = [
  { value: "decision_maker", label: "Decision Maker" },
  { value: "champion", label: "Champion" },
  { value: "blocker", label: "Blocker" },
  { value: "influencer", label: "Influencer" },
  { value: "end_user", label: "End User" },
];

interface StakeholderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Stakeholder, "id" | "touchpoints" | "last_interaction_date">) => void;
  accountId: string;
  stakeholder?: Stakeholder | null;
}

export function StakeholderForm({ open, onOpenChange, onSubmit, accountId, stakeholder }: StakeholderFormProps) {
  const [name, setName] = useState(stakeholder?.name ?? "");
  const [jobTitle, setJobTitle] = useState(stakeholder?.job_title ?? "");
  const [email, setEmail] = useState(stakeholder?.email ?? "");
  const [role, setRole] = useState<StakeholderRole>(stakeholder?.role ?? "champion");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    onSubmit({
      account_id: accountId,
      name,
      job_title: jobTitle,
      email,
      role,
    });
    // Reset form
    setName("");
    setJobTitle("");
    setEmail("");
    setRole("champion");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{stakeholder ? "Edit Stakeholder" : "Add Stakeholder"}</DialogTitle>
          <DialogDescription>
            {stakeholder ? "Update stakeholder details" : "Add a key person at this account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Job Title</label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="VP of Operations"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as StakeholderRole)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            {stakeholder ? "Save Changes" : "Add Stakeholder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
