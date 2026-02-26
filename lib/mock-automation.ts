import type { AutomationRule } from "./types";

// Pre-built automation rule templates and active rules.
// Rules follow a "When X happens, do Y" pattern.

export const mockAutomationRules: AutomationRule[] = [
  {
    id: "auto-1",
    name: "Onboarding workflow on new deal",
    description: "When a deal moves to Active stage, automatically apply the Thrive Local Onboarding workflow",
    trigger: "deal_stage_changed",
    trigger_config: { to_stage: "active" },
    action: "apply_workflow",
    action_config: { workflow_id: "wf-thrive-onboarding" },
    enabled: true,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "auto-2",
    name: "Alert on health drop",
    description: "When an account's health status drops to At Risk, send a notification to the account owner",
    trigger: "health_dropped",
    trigger_config: { to_status: "at_risk" },
    action: "send_notification",
    action_config: { to: "account_owner" },
    enabled: true,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "auto-3",
    name: "Follow-up task on overdue",
    description: "When a task becomes overdue, create a follow-up task assigned to the account manager",
    trigger: "task_overdue",
    trigger_config: { days_overdue: 1 },
    action: "create_task",
    action_config: { title_prefix: "Follow up: ", assigned_role: "account_manager", priority: "high" },
    enabled: true,
    created_at: "2026-01-20T00:00:00Z",
  },
  {
    id: "auto-4",
    name: "Renewal reminder",
    description: "When a renewal date is within 60 days, send a notification to the sales team",
    trigger: "renewal_approaching",
    trigger_config: { days_before: 60 },
    action: "send_notification",
    action_config: { to: "sales" },
    enabled: false,
    created_at: "2026-01-25T00:00:00Z",
  },
  {
    id: "auto-5",
    name: "Re-engagement on silence",
    description: "When there's no contact with a client for 7 days, create a check-in task",
    trigger: "no_contact_7_days",
    trigger_config: {},
    action: "create_task",
    action_config: { title: "Check in with client", assigned_role: "account_manager", priority: "medium" },
    enabled: false,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "auto-6",
    name: "Welcome workflow for new accounts",
    description: "When a new account is created, automatically apply the onboarding workflow",
    trigger: "new_account_created",
    trigger_config: {},
    action: "apply_workflow",
    action_config: { workflow_id: "wf-thrive-onboarding" },
    enabled: false,
    created_at: "2026-02-05T00:00:00Z",
  },
];

// Labels for displaying trigger and action types in the UI
export const triggerLabels: Record<string, string> = {
  deal_stage_changed: "Deal stage changes",
  task_overdue: "Task becomes overdue",
  health_dropped: "Health status drops",
  new_account_created: "New account created",
  renewal_approaching: "Renewal approaching",
  no_contact_7_days: "No contact for 7 days",
};

export const actionLabels: Record<string, string> = {
  create_task: "Create a task",
  send_notification: "Send notification",
  apply_workflow: "Apply workflow",
  change_health_status: "Change health status",
  assign_team_member: "Assign team member",
  add_tag: "Add tag",
};
