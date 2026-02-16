import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSourceOverrides } from "@/components/dashboard/client-source-overrides";
import { ClientTasks } from "@/components/dashboard/client-tasks";
import { ClientDeals } from "@/components/dashboard/client-deals";
import { ClientHealthTab } from "@/components/dashboard/client-health";
import { ClientApplyWorkflowButton } from "@/components/dashboard/client-apply-workflow-button";
import { AccountMembers } from "@/components/dashboard/account-members";
import { AccountBrief } from "@/components/dashboard/account-brief";
import { AccountChat } from "@/components/dashboard/account-chat";
import { MeetingPrep } from "@/components/dashboard/meeting-prep";
import { ClientIntelligence } from "@/components/dashboard/client-intelligence";
import { ClientTimeline } from "@/components/dashboard/client-timeline";
import { StakeholderView } from "@/components/dashboard/stakeholder-view";
import { CalendarPreview } from "@/components/dashboard/calendar-preview";

// Account detail page — shows account info, intelligence timeline, contacts,
// deals, tasks, health, timeline, stakeholders, and per-account knowledge source overrides.

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
// These stand in until real DB data is wired up.
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
        <div className="flex items-center gap-3 flex-wrap">
          <MeetingPrep
            clientId={id}
            clientName={placeholderClient.name}
            intelligence={placeholderIntelligenceForAI}
          />
          <ClientApplyWorkflowButton clientId={id} />
          <div className="flex gap-1">
            {placeholderClient.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="intelligence">
        {/* Horizontally scrollable tab bar for mobile and desktop with many tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="ask-ai">Ask AI</TabsTrigger>
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="intelligence" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            {placeholderIntelligence.length} entries (Account ID: {id})
          </p>

          <ClientIntelligence
            clientId={id}
            clientName={placeholderClient.name}
            entries={placeholderIntelligence}
            intelligence={placeholderIntelligenceForAI}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ClientTimeline clientId={id} />
        </TabsContent>

        <TabsContent value="ask-ai" className="mt-4">
          <AccountChat
            clientId={id}
            intelligence={placeholderIntelligenceForAI}
          />
        </TabsContent>

        <TabsContent value="brief" className="mt-4">
          <AccountBrief clientId={id} clientName={placeholderClient.name} intelligence={placeholderIntelligenceForAI} />
        </TabsContent>

        <TabsContent value="stakeholders" className="mt-4">
          <StakeholderView clientId={id} />
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <ClientSourceOverrides clientId={id} />
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          <ClientDeals clientId={id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <ClientTasks clientId={id} />
        </TabsContent>

        <TabsContent value="health" className="space-y-6 mt-4">
          <ClientHealthTab clientId={id} />
          {/* Upcoming events for this account */}
          <CalendarPreview accountId={id} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <AccountMembers clientId={id} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <div className="space-y-3">
            {placeholderClient.contacts.map((contact) => (
              <Card key={contact.email}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{contact.name}</CardTitle>
                  <CardDescription>
                    {contact.role} &middot; {contact.email}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
