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

// Activity feed — shows all intelligence entries in reverse chronological order.
// Has tabs for "All", "Emails", "Transcripts", and an "Unmatched" section
// for entries that couldn't be automatically assigned to a client.

const placeholderFeed = [
  { id: "1", summary: "Discussed Q2 renewal timeline", client: "Acme Corp", source: "email", sentiment: "positive", date: "Feb 10, 2026", autoTasks: 2, alerts: 0 },
  { id: "2", summary: "Budget concerns raised during quarterly review", client: "Globex Inc", source: "transcript", sentiment: "mixed", date: "Feb 9, 2026", autoTasks: 0, alerts: 1 },
  { id: "3", summary: "Onboarding kickoff meeting with new stakeholders", client: "Umbrella Co", source: "transcript", sentiment: "positive", date: "Feb 8, 2026", autoTasks: 1, alerts: 0 },
  { id: "4", summary: "Weekly sync covered project milestones", client: "Acme Corp", source: "transcript", sentiment: "neutral", date: "Feb 7, 2026", autoTasks: 1, alerts: 1 },
  { id: "5", summary: "Client expressed satisfaction with deliverables", client: "Initech", source: "email", sentiment: "positive", date: "Feb 6, 2026", autoTasks: 0, alerts: 0 },
];

const placeholderUnmatched = [
  { id: "u1", summary: "New inquiry about consulting services", from: "unknown@newco.com", source: "email", date: "Feb 10, 2026" },
  { id: "u2", summary: "General team meeting transcript", from: "internal", source: "transcript", date: "Feb 9, 2026" },
];

function sentimentColor(sentiment: string) {
  switch (sentiment) {
    case "positive": return "bg-green-100 text-green-800";
    case "negative": return "bg-red-100 text-red-800";
    case "mixed": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function ActionIndicators({ autoTasks, alerts }: { autoTasks: number; alerts: number }) {
  if (autoTasks === 0 && alerts === 0) return null;
  return (
    <div className="flex gap-1 mt-1.5">
      {autoTasks > 0 && (
        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
          {autoTasks} task{autoTasks !== 1 ? "s" : ""} created
        </Badge>
      )}
      {alerts > 0 && (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
          {alerts} alert{alerts !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">
          All intelligence entries across clients
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({placeholderFeed.length})</TabsTrigger>
          <TabsTrigger value="emails">
            Emails ({placeholderFeed.filter((i) => i.source === "email").length})
          </TabsTrigger>
          <TabsTrigger value="transcripts">
            Transcripts ({placeholderFeed.filter((i) => i.source === "transcript").length})
          </TabsTrigger>
          <TabsTrigger value="unmatched">
            Unmatched ({placeholderUnmatched.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {placeholderFeed.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.summary}</CardTitle>
                    <CardDescription>
                      {item.client} &middot;{" "}
                      {item.source === "email" ? "Email" : "Transcript"} &middot;{" "}
                      {item.date}
                    </CardDescription>
                    <ActionIndicators autoTasks={item.autoTasks} alerts={item.alerts} />
                  </div>
                  <Badge variant="secondary" className={sentimentColor(item.sentiment)}>
                    {item.sentiment}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="emails" className="space-y-3 mt-4">
          {placeholderFeed
            .filter((i) => i.source === "email")
            .map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.summary}</CardTitle>
                      <CardDescription>
                        {item.client} &middot; {item.date}
                      </CardDescription>
                      <ActionIndicators autoTasks={item.autoTasks} alerts={item.alerts} />
                    </div>
                    <Badge variant="secondary" className={sentimentColor(item.sentiment)}>
                      {item.sentiment}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="transcripts" className="space-y-3 mt-4">
          {placeholderFeed
            .filter((i) => i.source === "transcript")
            .map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.summary}</CardTitle>
                      <CardDescription>
                        {item.client} &middot; {item.date}
                      </CardDescription>
                      <ActionIndicators autoTasks={item.autoTasks} alerts={item.alerts} />
                    </div>
                    <Badge variant="secondary" className={sentimentColor(item.sentiment)}>
                      {item.sentiment}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="unmatched" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            These entries couldn&apos;t be automatically matched to a client.
            Assign them manually.
          </p>
          <Separator className="mb-3" />
          {placeholderUnmatched.map((item) => (
            <Card key={item.id} className="border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.summary}</CardTitle>
                    <CardDescription>
                      {item.from} &middot;{" "}
                      {item.source === "email" ? "Email" : "Transcript"} &middot;{" "}
                      {item.date}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Assign Client</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
