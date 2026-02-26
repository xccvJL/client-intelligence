"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { TeamMember, AccountMember, WorkflowTemplate, AccountBrief, IncomingLead, Notification } from "@/lib/types";
import { mockNotifications } from "@/lib/mock-notifications";
import { defaultPromptsMap } from "@/lib/default-prompts";
import { createBrowserClient } from "@/lib/supabase";

// This context holds the "current user" — the team member who is
// currently using the app. Since there's no login yet, we simulate
// it with a dropdown in the sidebar.
// Also holds shared state for notifications (so the bell count stays in sync).

// Placeholder team members (same ones used across the app).
const placeholderTeamMembers: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", email: "sarah@thrive.com", role: "account_manager", gmail_watch_label: null, created_at: "" },
  { id: "tm2", name: "Mike Torres", email: "mike@thrive.com", role: "sales", gmail_watch_label: null, created_at: "" },
];

const fallbackTemplates: WorkflowTemplate[] = [];

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
  // Incoming leads from the webhook test form (appears in Accounts + Pipeline immediately)
  incomingLeads: IncomingLead[];
  addIncomingLead: (lead: IncomingLead) => void;
  // Notifications state — shared so the bell count stays in sync across components
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  // AI system prompts — only stores overrides; empty object = all defaults
  systemPrompts: Record<string, string>;
  setSystemPrompts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  // Returns the custom prompt if one exists, otherwise the default
  getPrompt: (key: string) => string;
  // Request headers used by client-side API calls.
  getRequestHeaders: () => Record<string, string>;
  // Helper: returns the client IDs this user can access
  getAccessibleClientIds: (teamMemberId?: string) => string[];
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(
    placeholderTeamMembers[0] ?? null
  );
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(placeholderTeamMembers);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>(fallbackTemplates);
  const [accountBriefs, setAccountBriefs] = useState<AccountBrief[]>([]);
  const [incomingLeads, setIncomingLeads] = useState<IncomingLead[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});

  // Returns the custom prompt for a key, or falls back to the built-in default
  const getPrompt = useCallback(
    (key: string): string => {
      if (systemPrompts[key]) return systemPrompts[key];
      return defaultPromptsMap[key]?.defaultPrompt ?? "";
    },
    [systemPrompts]
  );

  const getRequestHeaders = useCallback((): Record<string, string> => {
    if (authToken) {
      return { authorization: `Bearer ${authToken}` };
    }

    // Dev fallback for local prototyping when OAuth is not wired.
    const allowDevHeaderAuth =
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_ALLOW_DEV_HEADER_AUTH !== "false";
    if (allowDevHeaderAuth && currentUser?.id) {
      return { "x-team-member-id": currentUser.id };
    }

    return {};
  }, [authToken, currentUser]);

  // Keep auth token in sync with Supabase auth session when available.
  useEffect(() => {
    const client = createBrowserClient();
    void client.auth
      .getSession()
      .then(({ data }) => {
        setAuthToken(data.session?.access_token ?? null);
      })
      .catch(() => {
        setAuthToken(null);
      });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const res = await fetch("/api/team-members", {
          headers: getRequestHeaders(),
        });
        if (!res.ok) return;

        const json = (await res.json()) as { data?: TeamMember[] };
        const fetchedMembers = json.data ?? [];
        if (fetchedMembers.length === 0) return;

        setTeamMembers(fetchedMembers);
        setCurrentUser((prev) => {
          if (prev && fetchedMembers.some((member) => member.id === prev.id)) {
            return prev;
          }
          return fetchedMembers[0];
        });
      } catch {
        // keep fallback team list when API is unavailable
      }
    }

    void loadTeamMembers();
  }, [getRequestHeaders]);

  useEffect(() => {
    async function loadAccountMembers() {
      if (!currentUser?.id) return;
      try {
        const params = new URLSearchParams({ team_member_id: currentUser.id });
        const res = await fetch(`/api/account-members?${params.toString()}`, {
          headers: getRequestHeaders(),
        });
        if (!res.ok) return;

        const json = (await res.json()) as { data?: AccountMember[] };
        setAccountMembers(json.data ?? []);
      } catch {
        setAccountMembers([]);
      }
    }

    void loadAccountMembers();
  }, [currentUser?.id, getRequestHeaders]);

  useEffect(() => {
    async function loadWorkflowTemplates() {
      try {
        const res = await fetch("/api/workflows", {
          headers: getRequestHeaders(),
        });
        if (!res.ok) return;

        const json = (await res.json()) as { data?: WorkflowTemplate[] };
        setWorkflowTemplates(json.data ?? []);
      } catch {
        setWorkflowTemplates([]);
      }
    }

    void loadWorkflowTemplates();
  }, [getRequestHeaders]);

  // Add a new lead from the webhook test form.
  // Prepends to the list and also grants the current user access to the new account.
  function addIncomingLead(lead: IncomingLead) {
    setIncomingLeads((prev) => [lead, ...prev]);

    // Give the current user access so the new account shows up in their filtered views
    if (currentUser) {
      setAccountMembers((prev) => [
        ...prev,
        {
          id: `am-lead-${lead.client.id}`,
          client_id: lead.client.id,
          team_member_id: currentUser.id,
          role: "owner" as const,
          created_at: lead.received_at,
        },
      ]);
    }
  }

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
        incomingLeads,
        addIncomingLead,
        notifications,
        setNotifications,
        systemPrompts,
        setSystemPrompts,
        getPrompt,
        getRequestHeaders,
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
