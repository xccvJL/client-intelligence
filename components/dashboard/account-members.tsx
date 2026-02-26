"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { AccountRole } from "@/lib/types";

// Shows who has access to a specific account, with add/remove controls.
// Used inside the "Team" tab on the account detail page.

export function AccountMembers({ clientId }: { clientId: string }) {
  const { teamMembers, accountMembers, setAccountMembers } = useTeamContext();
  const [addingMember, setAddingMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Members who currently have access to this account
  const members = accountMembers.filter((am) => am.client_id === clientId);

  // Team members who don't yet have access (available to add)
  const memberIds = members.map((m) => m.team_member_id);
  const availableToAdd = teamMembers.filter((tm) => !memberIds.includes(tm.id));

  function handleAdd() {
    if (!selectedMemberId) return;

    const newMember = {
      id: `am-${Date.now()}`,
      client_id: clientId,
      team_member_id: selectedMemberId,
      role: "member" as AccountRole,
      created_at: new Date().toISOString(),
    };

    setAccountMembers((prev) => [...prev, newMember]);
    setSelectedMemberId("");
    setAddingMember(false);
  }

  function handleRemove(accountMemberId: string) {
    // Don't allow removing the last owner
    const member = members.find((m) => m.id === accountMemberId);
    if (member?.role === "owner") {
      const ownerCount = members.filter((m) => m.role === "owner").length;
      if (ownerCount <= 1) return;
    }

    setAccountMembers((prev) => prev.filter((am) => am.id !== accountMemberId));
  }

  function getMemberName(teamMemberId: string) {
    return teamMembers.find((tm) => tm.id === teamMemberId)?.name ?? "Unknown";
  }

  function handleToggleRole(accountMemberId: string) {
    const member = members.find((m) => m.id === accountMemberId);
    if (!member) return;

    // Don't demote the last owner
    if (member.role === "owner") {
      const ownerCount = members.filter((m) => m.role === "owner").length;
      if (ownerCount <= 1) return;
    }

    const newRole = member.role === "owner" ? "member" : "owner";
    setAccountMembers((prev) =>
      prev.map((am) =>
        am.id === accountMemberId ? { ...am, role: newRole as AccountRole } : am
      )
    );
  }

  function handleAddAll() {
    const newMembers = availableToAdd.map((tm) => ({
      id: `am-${Date.now()}-${tm.id}`,
      client_id: clientId,
      team_member_id: tm.id,
      role: "member" as AccountRole,
      created_at: new Date().toISOString(),
    }));
    setAccountMembers((prev) => [...prev, ...newMembers]);
  }

  function getMemberRole(teamMemberId: string) {
    return teamMembers.find((tm) => tm.id === teamMemberId)?.role ?? "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} team {members.length === 1 ? "member" : "members"} have access
        </p>
        {availableToAdd.length > 0 && !addingMember && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAddAll}>
              Add All
            </Button>
            <Button size="sm" onClick={() => setAddingMember(true)}>
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* Add member form */}
      {addingMember && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((tm) => (
                    <SelectItem key={tm.id} value={tm.id}>
                      {tm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} disabled={!selectedMemberId}>
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAddingMember(false);
                  setSelectedMemberId("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((am) => {
          const isLastOwner =
            am.role === "owner" &&
            members.filter((m) => m.role === "owner").length <= 1;

          return (
            <Card key={am.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {getMemberName(am.team_member_id)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {getMemberRole(am.team_member_id).replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        am.role === "owner"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700",
                        isLastOwner
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:opacity-80"
                      )}
                      onClick={() => handleToggleRole(am.id)}
                    >
                      {am.role === "owner" ? "Owner" : "Member"}
                    </Badge>
                    {!isLastOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive h-7 px-2"
                        onClick={() => handleRemove(am.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No team members have access to this account yet.
        </p>
      )}
    </div>
  );
}
