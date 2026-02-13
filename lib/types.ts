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
