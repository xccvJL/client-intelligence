import Link from "next/link";
import {
  Card,
  CardContent,
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

// Account detail page — shows account info, intelligence timeline, contacts,
// deals, tasks, health, and per-account knowledge source overrides.

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

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-start justify-between">
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
        <div className="flex items-center gap-3">
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
        <TabsList>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            {placeholderIntelligence.length} entries (Account ID: {id})
          </p>

          {placeholderIntelligence.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.summary}</CardTitle>
                    <CardDescription>
                      {item.source === "email" ? "Email" : "Transcript"} &middot;{" "}
                      {item.date}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      item.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {item.sentiment}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
                {item.actionItems.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-muted-foreground mb-1">
                      Action Items:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {item.actionItems.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="brief" className="mt-4">
          <AccountBrief clientId={id} />
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

        <TabsContent value="health" className="mt-4">
          <ClientHealthTab clientId={id} />
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
