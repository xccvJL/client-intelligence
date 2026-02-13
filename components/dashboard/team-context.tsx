"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { TeamMember, AccountMember, WorkflowTemplate, AccountBrief } from "@/lib/types";

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

// Pre-built Thrive Local Onboarding template — shared across workflows and tasks
const defaultTemplates: WorkflowTemplate[] = [
  {
    id: "wf-thrive-onboarding",
    name: "Thrive Local Onboarding",
    description:
      "Standard onboarding workflow for new Thrive Local clients. Covers the full handoff from Sales through Account Management.",
    steps: [
      { title: "Mark Thrive Local status on deal", description: "Update the deal stage to reflect Thrive Local enrollment.", assigned_role: "sales", priority: "medium", due_in_days: 0, order: 1 },
      { title: "Set up project overview, add Tim & Ralph", description: "Create the project in the system and add key team members.", assigned_role: "onboarding", priority: "high", due_in_days: 1, order: 2 },
      { title: "Send intro email with Calendly links", description: "Send the client an introduction email with scheduling links for their onboarding calls.", assigned_role: "sales", priority: "high", due_in_days: 1, order: 3 },
      { title: "Alert specialists when GBP is connected", description: "Notify the specialist team once the client's Google Business Profile is connected.", assigned_role: "onboarding", priority: "medium", due_in_days: 3, order: 4 },
      { title: "Monitor status, help client connect platforms", description: "Track progress and assist the client with connecting their various platforms and accounts.", assigned_role: "onboarding", priority: "medium", due_in_days: 7, order: 5 },
      { title: "Handoff to AM if no movement", description: "If the client hasn't made progress, escalate to the Account Manager for direct outreach.", assigned_role: "account_manager", priority: "low", due_in_days: 14, order: 6 },
    ],
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
];

// Pre-built Acme Corp account brief with realistic entries from existing intelligence
const defaultAccountBriefs: AccountBrief[] = [
  {
    client_id: "1",
    client_name: "Acme Corp",
    sections: [
      {
        type: "key_context",
        entries: [
          { content: "Q2 renewal confirmed; expanded scope for next fiscal year", source_label: "Email — Feb 10, 2026", intelligence_id: "1" },
          { content: "Client expressed satisfaction with recent deliverables and timeline", source_label: "Email — Feb 3, 2026", intelligence_id: "3" },
        ],
      },
      {
        type: "decisions",
        entries: [
          { content: "Moving forward with expanded scope; SOW update in progress", source_label: "Email — Feb 10, 2026", intelligence_id: "1" },
        ],
      },
      {
        type: "budgets",
        entries: [
          { content: "$120K retainer + $80K expansion budget for next fiscal year", source_label: "Email — Feb 10, 2026", intelligence_id: "1" },
        ],
      },
      {
        type: "key_people",
        entries: [
          { content: "Jane Smith — VP of Operations, primary decision-maker", source_label: "Email — Feb 10, 2026", intelligence_id: "1" },
          { content: "Bob Johnson — Project Manager, flagged capacity concerns", source_label: "Transcript — Feb 7, 2026", intelligence_id: "2" },
        ],
      },
      {
        type: "risks",
        entries: [
          { content: "Team capacity concerns flagged during weekly sync", source_label: "Transcript — Feb 7, 2026", intelligence_id: "2" },
        ],
      },
    ],
    updated_at: "2026-02-10T00:00:00Z",
  },
];

interface TeamContextValue {
  currentUser: TeamMember | null;
  setCurrentUser: (member: TeamMember) => void;
  teamMembers: TeamMember[];
  accountMembers: AccountMember[];
  setAccountMembers: React.Dispatch<React.SetStateAction<AccountMember[]>>;
  showAllAccounts: boolean;
  setShowAllAccounts: (show: boolean) => void;
  workflowTemplates: WorkflowTemplate[];
  setWorkflowTemplates: React.Dispatch<React.SetStateAction<WorkflowTemplate[]>>;
  accountBriefs: AccountBrief[];
  setAccountBriefs: React.Dispatch<React.SetStateAction<AccountBrief[]>>;
  // Helper: returns the client IDs this user can access
  getAccessibleClientIds: (teamMemberId?: string) => string[];
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [teamMembers] = useState<TeamMember[]>(placeholderTeamMembers);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>(placeholderAccountMembers);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>(defaultTemplates);
  const [accountBriefs, setAccountBriefs] = useState<AccountBrief[]>(defaultAccountBriefs);

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
        showAllAccounts,
        setShowAllAccounts,
        workflowTemplates,
        setWorkflowTemplates,
        accountBriefs,
        setAccountBriefs,
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
