// ===========================================
// Database table types — these match the Supabase schema
// ===========================================

export type AccountStatus = "active" | "archived";

export interface Client {
  id: string;
  name: string;
  domain: string;
  contacts: ClientContact[];
  tags: string[];
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  name: string;
  email: string;
  role: string | null;
}

// Team roles — each team member has one of these roles,
// and tasks can be assigned to a role instead of (or in addition to) a person.
export type TeamRole = "sales" | "onboarding" | "account_manager" | "specialist";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  gmail_watch_label: string | null;
  created_at: string;
}

// ===========================================
// Knowledge sources — the dynamic source system
// ===========================================

// Current source types. New ones (slack, hubspot, teamwork, phone_log)
// get added here when we build their processors.
export type SourceType = "gmail" | "google_drive" | "manual_note";

export interface KnowledgeSource {
  id: string;
  name: string;
  source_type: SourceType;
  enabled: boolean;
  configuration: Record<string, unknown>;
  sync_interval_minutes: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Per-client overrides — lets you enable/disable specific sources
// for individual clients, or change their config (e.g., different
// folder IDs or label filters for a specific client).
export interface ClientSourceOverride {
  id: string;
  client_id: string;
  knowledge_source_id: string;
  enabled: boolean;
  configuration_override: Record<string, unknown>;
  created_at: string;
}

// ===========================================
// Processing queue and intelligence
// ===========================================

export type QueueItemStatus = "pending" | "processing" | "completed" | "failed";

export interface ProcessingQueueItem {
  id: string;
  source: SourceType;
  source_id: string;
  knowledge_source_id: string;
  raw_content: string;
  status: QueueItemStatus;
  client_id: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export interface Intelligence {
  id: string;
  client_id: string | null;
  source: SourceType;
  source_id: string;
  knowledge_source_id: string;
  summary: string;
  key_points: string[];
  sentiment: Sentiment;
  action_items: ActionItem[];
  people_mentioned: string[];
  topics: string[];
  raw_ai_response: Record<string, unknown>;
  created_at: string;
}

export interface ActionItem {
  description: string;
  assignee: string | null;
  due_date: string | null;
}

export interface SyncLog {
  id: string;
  knowledge_source_id: string;
  status: "success" | "error";
  items_processed: number;
  error_message: string | null;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// ===========================================
// CRM: Account members — who has access to which account
// ===========================================

export type AccountRole = "owner" | "member";

export interface AccountMember {
  id: string;
  client_id: string;       // which account
  team_member_id: string;  // which person
  role: AccountRole;       // owner = created/manages it, member = has access
  created_at: string;
}

// ===========================================
// CRM: Deals — tracks opportunities through a pipeline
// ===========================================

export type DealStage = "lead" | "proposal" | "active" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  client_id: string;
  title: string;
  stage: DealStage;
  amount: number | null;
  close_date: string | null;
  notes: string | null;
  created_by: string | null; // team member ID
  created_at: string;
  updated_at: string;
}

// ===========================================
// CRM: Client health — relationship status per client
// ===========================================

export type HealthStatus = "healthy" | "at_risk" | "churning";

export interface ClientHealth {
  id: string;
  client_id: string; // unique per client
  status: HealthStatus;
  satisfaction_score: number; // 1–10
  renewal_date: string | null;
  last_positive_signal: string | null;
  last_negative_signal: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Tasks — lightweight to-dos tied to clients
// ===========================================

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null; // team member ID
  assigned_role: TeamRole | null; // role-based assignment (instead of or alongside a person)
  due_date: string | null;
  intelligence_id: string | null; // the intelligence entry that spawned this
  workflow_template_id: string | null; // which workflow template created this task
  source: "manual" | "auto" | "workflow"; // manual = human-created, auto = AI-created, workflow = from template
  created_at: string;
  updated_at: string;
}

// ===========================================
// Health alerts — flags generated by the intelligence pipeline
// ===========================================

export type AlertType = "sentiment_drop" | "risk_topic" | "missed_renewal" | "no_recent_contact";
export type AlertSeverity = "info" | "warning" | "critical";

export interface HealthAlert {
  id: string;
  client_id: string;
  intelligence_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

// ===========================================
// Gemini AI response types
// ===========================================

export interface GeminiIntelligenceResponse {
  summary: string;
  key_points: string[];
  sentiment: Sentiment;
  action_items: ActionItem[];
  people_mentioned: string[];
  topics: string[];
  client_name_guess: string | null;
}

// ===========================================
// Workflow templates — reusable multi-step checklists
// ===========================================

export interface WorkflowStep {
  title: string;
  description: string | null;
  assigned_role: TeamRole;
  priority: TaskPriority;
  due_in_days: number; // relative deadline — 0 = same day, 3 = three days after applying
  order: number; // sequence position (1, 2, 3…)
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

// ===========================================
// Processor types — shared interface for all source processors
// ===========================================

export interface ProcessResult {
  processed: number;
  errors: number;
  error_messages: string[];
}

// ===========================================
// Lead form webhook — incoming form submissions
// ===========================================

// Shape of the JSON body sent by external forms to our webhook endpoint.
export interface LeadFormPayload {
  name: string;       // contact person's full name (required)
  email: string;      // contact email address (required)
  company: string;    // company / business name (required)
  phone?: string;     // phone number (optional)
  message?: string;   // free-text message from the form (optional)
}

// What gets stored in the dashboard after a lead is created.
// Bundles the new client, the new deal, and a timestamp so the UI
// can display the lead immediately without a page reload.
export interface IncomingLead {
  client: Client;
  deal: Deal & { clients?: { name: string } | null };
  received_at: string; // ISO timestamp
}

// ===========================================
// API response wrappers
// ===========================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
}

// ===========================================
// Account Brief — living knowledge document per account
// ===========================================

export type BriefSectionType = "key_context" | "decisions" | "budgets" | "key_people" | "risks";

export interface BriefEntry {
  content: string;
  source_label: string;                // human-readable attribution, e.g. "Email — Feb 10"
  intelligence_id: string | null;      // nullable link back to the source intelligence entry
}

export interface BriefSection {
  type: BriefSectionType;
  entries: BriefEntry[];
}

export interface AccountBrief {
  client_id: string;
  client_name: string;                 // used for the Markdown export header
  sections: BriefSection[];
  updated_at: string;
}

// ===========================================
// AI-native feature types
// ===========================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PrepBrief {
  summary: string;
  recent_highlights: string[];
  open_risks: string[];
  key_topics: string[];
  talking_points: string[];
}

export interface DraftResponse {
  subject: string;
  body: string;
  tone: string;
}

export interface LeadEnrichment {
  industry: string;
  company_size: string;
  likely_needs: string[];
  suggested_approach: string;
}

export interface Nudge {
  id: string;
  message: string;
  account_name: string;
  account_id: string;
  priority: "high" | "medium" | "low";
  category: string;
}

// ===========================================
// AI-generated account brief — raw AI output before converting to BriefEntry[]
// ===========================================

export interface GeneratedAccountBriefResponse {
  key_context: string[];
  decisions: string[];
  budgets: string[];
  key_people: string[];
  risks: string[];
}

// ===========================================
// Dashboard briefing — prioritized daily focus items
// ===========================================

export interface DashboardBriefingItem {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  account_name: string;
  account_id: string;
}

// ===========================================
// Activity Logging — tracks "who did what and when"
// ===========================================

export type ActivityEventType =
  | "account_created"
  | "account_archived"
  | "account_restored"
  | "deal_created"
  | "deal_stage_changed"
  | "deal_won"
  | "deal_lost"
  | "task_created"
  | "task_completed"
  | "task_reassigned"
  | "note_added"
  | "email_synced"
  | "meeting_logged"
  | "health_changed"
  | "contact_added"
  | "workflow_applied"
  | "intelligence_received"
  | "brief_updated";

export interface ActivityLogEntry {
  id: string;
  event_type: ActivityEventType;
  description: string;
  actor_name: string;
  account_name: string | null;
  account_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ===========================================
// Global Search — Cmd+K search across everything
// ===========================================

export type SearchResultType = "account" | "deal" | "task" | "contact" | "intelligence";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}

// ===========================================
// Notifications & Reminders
// ===========================================

export type NotificationType =
  | "overdue_task"
  | "health_drop"
  | "deal_stagnant"
  | "upcoming_renewal"
  | "new_intelligence"
  | "mention"
  | "workflow_complete";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  account_name: string | null;
  account_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  overdue_task: boolean;
  health_drop: boolean;
  deal_stagnant: boolean;
  upcoming_renewal: boolean;
  new_intelligence: boolean;
  mention: boolean;
  workflow_complete: boolean;
}

// ===========================================
// Email / Calendar Sync UI
// ===========================================

export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "disconnected" | "syncing" | "error";
  last_synced_at: string | null;
  icon: string;
}

export interface SyncedEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  snippet: string;
  date: string;
  matched_account_id: string | null;
  matched_account_name: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  matched_account_id: string | null;
  matched_account_name: string | null;
  location: string | null;
}

// ===========================================
// Client Timeline — unified chronological view
// ===========================================

export type TimelineEventType =
  | "email"
  | "deal_change"
  | "task_completed"
  | "health_change"
  | "note"
  | "meeting"
  | "intelligence"
  | "contact_added"
  | "workflow";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  sentiment: Sentiment | null;
  actor_name: string | null;
  created_at: string;
}

// ===========================================
// Stakeholder / Relationship Map
// ===========================================

export type StakeholderRole = "decision_maker" | "champion" | "blocker" | "influencer" | "end_user";

export interface StakeholderTouchpoint {
  id: string;
  type: "email" | "meeting" | "call" | "note";
  summary: string;
  date: string;
  team_member_name: string;
}

export interface Stakeholder {
  id: string;
  account_id: string;
  name: string;
  job_title: string;
  email: string;
  role: StakeholderRole;
  last_interaction_date: string | null;
  touchpoints: StakeholderTouchpoint[];
}

// ===========================================
// Dashboard Analytics & Reporting
// ===========================================

export interface PipelineVelocityPoint {
  month: string;
  lead: number;
  proposal: number;
  active: number;
  closed_won: number;
}

export interface WinRatePoint {
  month: string;
  rate: number;
  deals_won: number;
  deals_lost: number;
}

export interface HealthTrendPoint {
  month: string;
  healthy: number;
  at_risk: number;
  churning: number;
}

export interface TeamWorkloadPoint {
  member_name: string;
  todo: number;
  in_progress: number;
  done: number;
}

// ===========================================
// Automation Rules + Bulk Actions
// ===========================================

export type AutomationTrigger =
  | "deal_stage_changed"
  | "task_overdue"
  | "health_dropped"
  | "new_account_created"
  | "renewal_approaching"
  | "no_contact_7_days";

export type AutomationAction =
  | "create_task"
  | "send_notification"
  | "apply_workflow"
  | "change_health_status"
  | "assign_team_member"
  | "add_tag";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  trigger_config: Record<string, unknown>;
  action: AutomationAction;
  action_config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
}
