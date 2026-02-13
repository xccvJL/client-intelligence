"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { TeamMember, AccountMember } from "@/lib/types";

// This context holds the "current user" — the team member who is
// currently using the app. Since there's no login yet, we simulate
// it with a dropdown in the sidebar.

// Placeholder team members (same ones used across the app).
const placeholderTeamMembers: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", email: "sarah@thrive.com", role: "account_manager", gmail_watch_label: null, created_at: "" },
  { id: "tm2", name: "Mike Torres", email: "mike@thrive.com", role: "sales", gmail_watch_label: null, created_at: "" },
];

// Placeholder account memberships — maps who has access to which accounts.
// Sarah (tm1) → Acme Corp (1), Globex Inc (2)
// Mike (tm2)  → Acme Corp (1), Umbrella Co (4), Initech (3)
const placeholderAccountMembers: AccountMember[] = [
  { id: "am1", client_id: "1", team_member_id: "tm1", role: "owner", created_at: "" },
  { id: "am2", client_id: "2", team_member_id: "tm1", role: "member", created_at: "" },
  { id: "am3", client_id: "1", team_member_id: "tm2", role: "member", created_at: "" },
  { id: "am4", client_id: "4", team_member_id: "tm2", role: "owner", created_at: "" },
  { id: "am5", client_id: "3", team_member_id: "tm2", role: "member", created_at: "" },
];

interface TeamContextValue {
  currentUser: TeamMember | null;
  setCurrentUser: (member: TeamMember) => void;
  teamMembers: TeamMember[];
  accountMembers: AccountMember[];
  setAccountMembers: React.Dispatch<React.SetStateAction<AccountMember[]>>;
  // Helper: returns the client IDs this user can access
  getAccessibleClientIds: (teamMemberId?: string) => string[];
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [teamMembers] = useState<TeamMember[]>(placeholderTeamMembers);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>(placeholderAccountMembers);

  // Default to the first team member on mount
  useEffect(() => {
    if (!currentUser && teamMembers.length > 0) {
      setCurrentUser(teamMembers[0]);
    }
  }, [currentUser, teamMembers]);

  function getAccessibleClientIds(teamMemberId?: string) {
    const memberId = teamMemberId ?? currentUser?.id;
    if (!memberId) return [];
    return accountMembers
      .filter((am) => am.team_member_id === memberId)
      .map((am) => am.client_id);
  }

  return (
    <TeamContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teamMembers,
        accountMembers,
        setAccountMembers,
        getAccessibleClientIds,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamContext must be used inside <TeamProvider>");
  }
  return context;
}
