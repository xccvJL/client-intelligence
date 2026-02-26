import type { TimelineEvent } from "./types";

// Timeline events per account — a unified chronological view mixing
// emails, deal changes, task completions, health changes, notes, and meetings.

// Account 1 — Acme Corp (20+ events)
export const acmeTimeline: TimelineEvent[] = [
  { id: "tl-1", type: "email", title: "Email: Q2 Renewal Timeline", description: "Discussed Q2 renewal timeline and expanded scope for next fiscal year. Jane Smith confirmed budget allocation.", sentiment: "positive", actor_name: "Jane Smith", created_at: "2026-02-15T14:30:00Z" },
  { id: "tl-2", type: "deal_change", title: "Deal moved to Proposal", description: "\"Acme Corp — Expanded Scope\" moved from Lead to Proposal stage ($80,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-14T09:15:00Z" },
  { id: "tl-3", type: "task_completed", title: "Task completed", description: "\"Review resource allocation\" marked as done by Sarah Chen", sentiment: null, actor_name: "Sarah Chen", created_at: "2026-02-13T16:45:00Z" },
  { id: "tl-4", type: "meeting", title: "Weekly sync meeting", description: "Covered project milestones and team capacity concerns. Bob Johnson flagged resource constraints for Q2.", sentiment: "neutral", actor_name: "Sarah Chen", created_at: "2026-02-13T10:00:00Z" },
  { id: "tl-5", type: "intelligence", title: "New intelligence extracted", description: "3 key insights from email correspondence — renewal confirmed, scope expansion approved, SOW update needed", sentiment: "positive", actor_name: null, created_at: "2026-02-12T16:30:00Z" },
  { id: "tl-6", type: "note", title: "Note added", description: "Client mentioned potential budget increase for Q3 during informal call", sentiment: "positive", actor_name: "Sarah Chen", created_at: "2026-02-12T14:00:00Z" },
  { id: "tl-7", type: "email", title: "Email: SOW Draft Review", description: "Sent updated SOW draft for review. Client requested minor adjustments to deliverable timeline.", sentiment: "neutral", actor_name: "Sarah Chen", created_at: "2026-02-11T11:00:00Z" },
  { id: "tl-8", type: "health_change", title: "Health status stable", description: "Monthly health check — maintaining Healthy status. Satisfaction score: 8/10", sentiment: "positive", actor_name: null, created_at: "2026-02-10T09:00:00Z" },
  { id: "tl-9", type: "contact_added", title: "Contact added", description: "Bob Johnson (Project Manager) added as a contact", sentiment: null, actor_name: "Sarah Chen", created_at: "2026-02-09T10:30:00Z" },
  { id: "tl-10", type: "email", title: "Email: Deliverables Satisfaction", description: "Client expressed satisfaction with recent deliverables and timeline adherence", sentiment: "positive", actor_name: "Jane Smith", created_at: "2026-02-08T15:00:00Z" },
  { id: "tl-11", type: "workflow", title: "Workflow tasks created", description: "6 onboarding tasks created from \"Thrive Local Onboarding\" template", sentiment: null, actor_name: "Sarah Chen", created_at: "2026-02-07T15:00:00Z" },
  { id: "tl-12", type: "meeting", title: "Kickoff meeting", description: "Initial kickoff meeting with expanded team. Discussed scope, timeline, and resource allocation.", sentiment: "positive", actor_name: "Mike Torres", created_at: "2026-02-06T14:00:00Z" },
  { id: "tl-13", type: "deal_change", title: "Deal created", description: "\"Acme Corp — Annual Retainer\" created ($120,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-05T11:00:00Z" },
  { id: "tl-14", type: "note", title: "Note added", description: "VP confirmed they want to expand into additional service areas next quarter", sentiment: "positive", actor_name: "Mike Torres", created_at: "2026-02-04T16:30:00Z" },
  { id: "tl-15", type: "email", title: "Email: Scope Discussion", description: "Detailed discussion about expanding scope of services for the upcoming fiscal year", sentiment: "positive", actor_name: "Jane Smith", created_at: "2026-02-03T10:00:00Z" },
  { id: "tl-16", type: "intelligence", title: "Intelligence: Budget signals", description: "AI detected positive budget signals — client discussing increased investment", sentiment: "positive", actor_name: null, created_at: "2026-02-02T14:00:00Z" },
  { id: "tl-17", type: "task_completed", title: "Task completed", description: "\"Send intro email with Calendly links\" completed", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-01T11:00:00Z" },
  { id: "tl-18", type: "contact_added", title: "Contact added", description: "Jane Smith (VP of Operations) added as primary contact", sentiment: null, actor_name: "Sarah Chen", created_at: "2026-01-31T09:30:00Z" },
  { id: "tl-19", type: "health_change", title: "Health assessed", description: "Initial health assessment: Healthy. High engagement and positive sentiment.", sentiment: "positive", actor_name: null, created_at: "2026-01-30T09:00:00Z" },
  { id: "tl-20", type: "deal_change", title: "Deal created", description: "\"Acme Corp — Expanded Scope\" deal created ($80,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-01-29T14:00:00Z" },
];

// Account 2 — Globex Inc
export const globexTimeline: TimelineEvent[] = [
  { id: "tl-g1", type: "health_change", title: "Health dropped to At Risk", description: "Health status changed from Healthy to At Risk due to budget concerns and reduced engagement", sentiment: "negative", actor_name: null, created_at: "2026-02-15T14:20:00Z" },
  { id: "tl-g2", type: "email", title: "Email: Budget Concerns", description: "Finance team raised concerns about Q3 budget projections during quarterly review", sentiment: "negative", actor_name: "finance@globex.com", created_at: "2026-02-14T11:00:00Z" },
  { id: "tl-g3", type: "deal_change", title: "Deal moved to Proposal", description: "\"Globex Q3 Strategy Package\" moved from Lead to Proposal ($45,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-08T14:00:00Z" },
  { id: "tl-g4", type: "deal_change", title: "Deal won", description: "\"Globex Q1 Sprint\" marked as Closed Won ($30,000)", sentiment: "positive", actor_name: "Mike Torres", created_at: "2026-02-05T16:00:00Z" },
  { id: "tl-g5", type: "meeting", title: "Strategy review meeting", description: "Discussed Q3 strategy and potential new engagement areas", sentiment: "neutral", actor_name: "Sarah Chen", created_at: "2026-02-03T10:00:00Z" },
  { id: "tl-g6", type: "note", title: "Note added", description: "Client hinted at potential scope reduction if budget isn't approved", sentiment: "negative", actor_name: "Sarah Chen", created_at: "2026-02-01T15:00:00Z" },
];

// Account 3 — Initech
export const initechTimeline: TimelineEvent[] = [
  { id: "tl-i1", type: "workflow", title: "Onboarding workflow applied", description: "\"Thrive Local Onboarding\" workflow applied — 6 tasks created", sentiment: null, actor_name: "Sarah Chen", created_at: "2026-02-07T15:00:00Z" },
  { id: "tl-i2", type: "deal_change", title: "Deal active", description: "\"Initech — Onboarding Support\" is now Active ($25,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-05T11:00:00Z" },
  { id: "tl-i3", type: "note", title: "Note added", description: "Need to schedule onboarding call with new point of contact", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-04T11:00:00Z" },
  { id: "tl-i4", type: "contact_added", title: "Contact added", description: "New point of contact added for onboarding process", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-03T10:00:00Z" },
];

// Account 4 — Umbrella Co
export const umbrellaTimeline: TimelineEvent[] = [
  { id: "tl-u1", type: "email", title: "Email: Onboarding Progress", description: "Client sent update on onboarding progress — GBP connected, working on platform integrations", sentiment: "positive", actor_name: "contact@umbrella.co", created_at: "2026-02-13T09:15:00Z" },
  { id: "tl-u2", type: "workflow", title: "Onboarding workflow applied", description: "\"Thrive Local Onboarding\" workflow applied — 6 tasks created", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-11T15:30:00Z" },
  { id: "tl-u3", type: "deal_change", title: "Deal created", description: "\"Umbrella Co — Initial Assessment\" created ($15,000)", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-11T11:00:00Z" },
  { id: "tl-u4", type: "contact_added", title: "Account created", description: "New account Umbrella Co created and assigned to Mike Torres", sentiment: null, actor_name: "Mike Torres", created_at: "2026-02-11T09:00:00Z" },
];

// Map account IDs to their timelines for easy lookup
export const timelinesByAccount: Record<string, TimelineEvent[]> = {
  "1": acmeTimeline,
  "2": globexTimeline,
  "3": initechTimeline,
  "4": umbrellaTimeline,
};
