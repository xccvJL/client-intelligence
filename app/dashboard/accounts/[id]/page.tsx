import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientApplyWorkflowButton } from "@/components/dashboard/client-apply-workflow-button";
import { MeetingPrep } from "@/components/dashboard/meeting-prep";
import { AccountDetailTabs } from "@/components/dashboard/account-detail-tabs";

// Account detail page — shows account info header and the tabbed detail view.
// The Tabs UI (including tab state and the "More" dropdown) lives in
// AccountDetailTabs, a client component, so this page stays a server component.

const placeholderClient = {
  name: "Acme Corp",
  domain: "acme.com",
  contacts: [
    { name: "Jane Smith", email: "jane@acme.com", role: "VP of Operations" },
    { name: "Bob Johnson", email: "bob@acme.com", role: "Project Manager" },
  ],
  tags: ["Enterprise", "Q2 Renewal"],
};

const placeholderIntelligence = [
  {
    id: "1",
    summary: "Discussed Q2 renewal timeline and expanded scope for next fiscal year",
    source: "email",
    sentiment: "positive",
    date: "Feb 10, 2026",
    topics: ["Renewal", "Expansion"],
    actionItems: ["Send updated SOW by Friday", "Schedule follow-up with VP"],
  },
  {
    id: "2",
    summary: "Weekly sync covered project milestones and team capacity concerns",
    source: "transcript",
    sentiment: "neutral",
    date: "Feb 7, 2026",
    topics: ["Project Status", "Capacity"],
    actionItems: ["Review resource allocation"],
  },
  {
    id: "3",
    summary: "Client expressed satisfaction with recent deliverables and timeline",
    source: "email",
    sentiment: "positive",
    date: "Feb 3, 2026",
    topics: ["Deliverables", "Satisfaction"],
    actionItems: [],
  },
];

// Placeholder Intelligence objects for the AI features (matching the real type shape).
const placeholderIntelligenceForAI = placeholderIntelligence.map((item) => ({
  id: item.id,
  client_id: null,
  source: item.source as "gmail" | "google_drive" | "manual_note",
  source_id: "",
  knowledge_source_id: "",
  summary: item.summary,
  key_points: item.topics,
  sentiment: item.sentiment as "positive" | "neutral" | "negative" | "mixed",
  action_items: item.actionItems.map((a) => ({
    description: a,
    assignee: null,
    due_date: null,
  })),
  people_mentioned: [],
  topics: item.topics,
  raw_ai_response: {},
  created_at: item.date,
}));

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href="/dashboard/accounts"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Accounts
            </Link>
            <span className="text-muted-foreground">/</span>
          </div>
          <h1 className="text-2xl font-bold">{placeholderClient.name}</h1>
          <p className="text-muted-foreground">{placeholderClient.domain}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MeetingPrep
            clientId={id}
            clientName={placeholderClient.name}
            intelligence={placeholderIntelligenceForAI}
          />
          <ClientApplyWorkflowButton clientId={id} />
          <div className="flex gap-1 ml-1">
            {placeholderClient.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <AccountDetailTabs
        clientId={id}
        clientName={placeholderClient.name}
        intelligence={placeholderIntelligence}
        intelligenceForAI={placeholderIntelligenceForAI}
      />
    </div>
  );
}
