import { createServerClient } from "@/lib/supabase";
import type { Intelligence, TeamMember, HealthAlert, AlertType, AlertSeverity } from "@/lib/types";

// Intelligence-to-action pipeline — two functions that run after every
// piece of intelligence is saved. They close the loop between "knowing
// something" and "doing something about it."

// Risk-related words that should trigger a health alert when found in topics
const RISK_WORDS = [
  "budget",
  "concern",
  "delay",
  "cancel",
  "churn",
  "unhappy",
  "complaint",
  "risk",
  "issue",
  "problem",
  "frustrated",
  "disappointed",
];

// ─── Auto-create tasks from action items ─────────────────────────

export async function createTasksFromIntelligence(
  intelligence: Intelligence
): Promise<void> {
  // Can't assign tasks without a client
  if (!intelligence.client_id) return;

  // Nothing to create if there are no action items
  if (!intelligence.action_items || intelligence.action_items.length === 0) return;

  const supabase = createServerClient();

  // Fetch team members so we can fuzzy-match assignee names
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*");

  const members: TeamMember[] = teamMembers ?? [];

  for (const item of intelligence.action_items) {
    // Try to match the AI's assignee string to a real team member
    const assigneeId = item.assignee
      ? fuzzyMatchMember(item.assignee, members)
      : null;

    await supabase.from("tasks").insert({
      client_id: intelligence.client_id,
      title: item.description,
      description: null,
      status: "todo",
      priority: "medium",
      assignee_id: assigneeId,
      due_date: item.due_date ?? null,
      intelligence_id: intelligence.id,
      source: "auto",
    });
  }
}

// Simple fuzzy match — checks if any team member's name contains
// the assignee string (case-insensitive), or vice versa.
function fuzzyMatchMember(
  assigneeName: string,
  members: TeamMember[]
): string | null {
  const lower = assigneeName.toLowerCase().trim();

  for (const member of members) {
    const memberLower = member.name.toLowerCase();
    if (memberLower.includes(lower) || lower.includes(memberLower)) {
      return member.id;
    }
    // Also check first name only (e.g., "Sarah" matches "Sarah Chen")
    const firstName = memberLower.split(" ")[0];
    if (firstName && lower.includes(firstName)) {
      return member.id;
    }
  }

  return null;
}

// ─── Evaluate health signals ─────────────────────────────────────

export async function evaluateHealthSignals(
  intelligence: Intelligence
): Promise<void> {
  // Can't evaluate health without a client
  if (!intelligence.client_id) return;

  const supabase = createServerClient();
  const alerts: Partial<HealthAlert>[] = [];

  // Check for negative sentiment → create a sentiment_drop alert
  if (intelligence.sentiment === "negative") {
    alerts.push({
      client_id: intelligence.client_id,
      intelligence_id: intelligence.id,
      alert_type: "sentiment_drop" as AlertType,
      severity: "warning" as AlertSeverity,
      message: `Negative sentiment detected: "${intelligence.summary.slice(0, 100)}"`,
      acknowledged: false,
    });
  }

  // Check if topics contain risk-related words → create a risk_topic alert
  const riskyTopics = intelligence.topics.filter((topic) =>
    RISK_WORDS.some((word) => topic.toLowerCase().includes(word))
  );

  if (riskyTopics.length > 0) {
    alerts.push({
      client_id: intelligence.client_id,
      intelligence_id: intelligence.id,
      alert_type: "risk_topic" as AlertType,
      severity: "warning" as AlertSeverity,
      message: `Risk topics detected: ${riskyTopics.join(", ")}`,
      acknowledged: false,
    });
  }

  // Insert any alerts we generated
  if (alerts.length > 0) {
    await supabase.from("health_alerts").insert(alerts);
  }

  // Update the client_health record with signal timestamps
  const now = new Date().toISOString();
  const isPositive = intelligence.sentiment === "positive";
  const isNegative =
    intelligence.sentiment === "negative" || riskyTopics.length > 0;

  // Upsert the client health record
  const { data: existing } = await supabase
    .from("client_health")
    .select("*")
    .eq("client_id", intelligence.client_id)
    .single();

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (isPositive) updates.last_positive_signal = now;
    if (isNegative) {
      updates.last_negative_signal = now;
      // Auto-escalate to at_risk on negative signals
      if (existing.status === "healthy") {
        updates.status = "at_risk";
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("client_health")
        .update(updates)
        .eq("id", existing.id);
    }
  } else if (isNegative) {
    // Create a new health record starting at at_risk
    await supabase.from("client_health").insert({
      client_id: intelligence.client_id,
      status: "at_risk",
      satisfaction_score: 5,
      last_negative_signal: now,
    });
  }
}
