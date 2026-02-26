"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { AccountMember, AccountRole } from "@/lib/types";

// Shows who has access to a specific account, with API-backed add/remove/role controls.
// Used inside the "Team" tab on the account detail page.

export function AccountMembers({ clientId }: { clientId: string }) {
  const { teamMembers, currentUser, setAccountMembers, getRequestHeaders } = useTeamContext();
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      setPageError(null);
      try {
        const params = new URLSearchParams({ client_id: clientId });
        const res = await fetch(`/api/account-members?${params.toString()}`, {
          headers: getRequestHeaders(),
        });
        const json = (await res.json()) as { data?: AccountMember[]; error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load account members");
        }
        setMembers(json.data ?? []);
      } catch (error) {
        setMembers([]);
        setPageError(
          error instanceof Error ? error.message : "Failed to load account members"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMembers();
  }, [clientId, getRequestHeaders]);

  const memberIds = useMemo(
    () => new Set(members.map((member) => member.team_member_id)),
    [members]
  );

  const availableToAdd = useMemo(
    () => teamMembers.filter((teamMember) => !memberIds.has(teamMember.id)),
    [teamMembers, memberIds]
  );

  function syncCurrentUserMembership(member: AccountMember | null) {
    if (!currentUser) return;

    if (!member || member.team_member_id !== currentUser.id || member.client_id !== clientId) {
      return;
    }

    setAccountMembers((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === member.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = member;
        return next;
      }

      const sameClientExistingIndex = prev.findIndex(
        (item) => item.client_id === member.client_id && item.team_member_id === member.team_member_id
      );
      if (sameClientExistingIndex >= 0) {
        const next = [...prev];
        next[sameClientExistingIndex] = member;
        return next;
      }

      return [...prev, member];
    });
  }

  function removeCurrentUserMembership(accountMemberId: string) {
    if (!currentUser) return;
    setAccountMembers((prev) => prev.filter((item) => item.id !== accountMemberId));
  }

  async function handleAdd() {
    if (!selectedMemberId) return;
    setPageError(null);

    const optimisticId = `am-optimistic-${Date.now()}`;
    const optimisticMember: AccountMember = {
      id: optimisticId,
      client_id: clientId,
      team_member_id: selectedMemberId,
      role: "member",
      created_at: new Date().toISOString(),
    };

    setMembers((prev) => [...prev, optimisticMember]);

    try {
      const res = await fetch("/api/account-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({
          client_id: clientId,
          team_member_id: selectedMemberId,
          role: "member",
        }),
      });
      const json = (await res.json()) as { data?: AccountMember; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to add member");
      }

      setMembers((prev) =>
        prev.map((item) => (item.id === optimisticId ? json.data! : item))
      );
      syncCurrentUserMembership(json.data);
      setSelectedMemberId("");
      setAddingMember(false);
    } catch (error) {
      setMembers((prev) => prev.filter((item) => item.id !== optimisticId));
      setPageError(error instanceof Error ? error.message : "Failed to add member");
    }
  }

  async function handleAddAll() {
    if (availableToAdd.length === 0) return;
    setPageError(null);

    const previous = members;
    const optimisticMembers: AccountMember[] = availableToAdd.map((teamMember, index) => ({
      id: `am-optimistic-${Date.now()}-${index}`,
      client_id: clientId,
      team_member_id: teamMember.id,
      role: "member",
      created_at: new Date().toISOString(),
    }));
    setMembers((prev) => [...prev, ...optimisticMembers]);

    try {
      const createdMembers = await Promise.all(
        availableToAdd.map(async (teamMember) => {
          const res = await fetch("/api/account-members", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getRequestHeaders(),
            },
            body: JSON.stringify({
              client_id: clientId,
              team_member_id: teamMember.id,
              role: "member",
            }),
          });
          const json = (await res.json()) as { data?: AccountMember; error?: string };
          if (!res.ok || !json.data) {
            throw new Error(json.error ?? `Failed to add ${teamMember.name}`);
          }
          return json.data;
        })
      );

      setMembers([...previous, ...createdMembers]);
      for (const member of createdMembers) {
        syncCurrentUserMembership(member);
      }
    } catch (error) {
      setMembers(previous);
      setPageError(error instanceof Error ? error.message : "Failed to add members");
    }
  }

  async function handleRemove(accountMemberId: string) {
    const member = members.find((item) => item.id === accountMemberId);
    if (!member) return;

    if (member.role === "owner") {
      const ownerCount = members.filter((item) => item.role === "owner").length;
      if (ownerCount <= 1) return;
    }

    setPageError(null);
    const previous = members;
    setMembers((prev) => prev.filter((item) => item.id !== accountMemberId));

    try {
      const res = await fetch(`/api/account-members/${accountMemberId}`, {
        method: "DELETE",
        headers: getRequestHeaders(),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to remove member");
      }

      if (member.team_member_id === currentUser?.id) {
        removeCurrentUserMembership(accountMemberId);
      }
    } catch (error) {
      setMembers(previous);
      setPageError(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  async function handleToggleRole(accountMemberId: string) {
    const member = members.find((item) => item.id === accountMemberId);
    if (!member) return;

    if (member.role === "owner") {
      const ownerCount = members.filter((item) => item.role === "owner").length;
      if (ownerCount <= 1) return;
    }

    const newRole: AccountRole = member.role === "owner" ? "member" : "owner";
    setPageError(null);
    const previous = members;

    setMembers((prev) =>
      prev.map((item) =>
        item.id === accountMemberId ? { ...item, role: newRole } : item
      )
    );

    try {
      const res = await fetch(`/api/account-members/${accountMemberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({ role: newRole }),
      });
      const json = (await res.json()) as { data?: AccountMember; error?: string };
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to update role");
      }

      setMembers((prev) =>
        prev.map((item) => (item.id === accountMemberId ? json.data! : item))
      );
      syncCurrentUserMembership(json.data);
    } catch (error) {
      setMembers(previous);
      setPageError(error instanceof Error ? error.message : "Failed to update role");
    }
  }

  function getMemberName(teamMemberId: string) {
    return teamMembers.find((member) => member.id === teamMemberId)?.name ?? "Unknown";
  }

  function getMemberRole(teamMemberId: string) {
    return teamMembers.find((member) => member.id === teamMemberId)?.role ?? "";
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

      {pageError && <p className="text-sm text-destructive">{pageError}</p>}

      {addingMember && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((teamMember) => (
                    <SelectItem key={teamMember.id} value={teamMember.id}>
                      {teamMember.name}
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

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading team access...</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const isLastOwner =
              member.role === "owner" &&
              members.filter((item) => item.role === "owner").length <= 1;

            return (
              <Card key={member.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {getMemberName(member.team_member_id)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {getMemberRole(member.team_member_id).replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          member.role === "owner"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                          isLastOwner
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:opacity-80"
                        )}
                        onClick={() => handleToggleRole(member.id)}
                      >
                        {member.role === "owner" ? "Owner" : "Member"}
                      </Badge>
                      {!isLastOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive h-7 px-2"
                          onClick={() => handleRemove(member.id)}
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
      )}

      {!loading && members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No team members have access to this account yet.
        </p>
      )}
    </div>
  );
}
