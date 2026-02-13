"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamContext } from "@/components/dashboard/team-context";

// Dropdown for picking "who am I" — shown in the sidebar.
// Changes the current user across the whole app.

export function TeamSelector() {
  const { currentUser, setCurrentUser, teamMembers } = useTeamContext();

  if (teamMembers.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium">Viewing as</p>
      <Select
        value={currentUser?.id ?? ""}
        onValueChange={(id) => {
          const member = teamMembers.find((m) => m.id === id);
          if (member) setCurrentUser(member);
        }}
      >
        <SelectTrigger className="w-full text-sm">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
