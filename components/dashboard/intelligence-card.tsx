import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge } from "./sentiment-badge";
import type { Intelligence, Sentiment, SourceType } from "@/lib/types";

// Displays a single intelligence entry — the summary, sentiment,
// source type, and key topics. Used in the feed and on client detail pages.

const sourceLabels: Record<SourceType, string> = {
  gmail: "Email",
  google_drive: "Transcript",
  manual_note: "Note",
};

interface IntelligenceCardProps {
  intelligence: Intelligence & { clients?: { name: string } | null };
}

export function IntelligenceCard({ intelligence }: IntelligenceCardProps) {
  const date = new Date(intelligence.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base leading-snug">
              {intelligence.summary.slice(0, 120)}
              {intelligence.summary.length > 120 ? "..." : ""}
            </CardTitle>
            <CardDescription>
              {intelligence.clients?.name ?? "Unmatched"} &middot;{" "}
              {sourceLabels[intelligence.source]} &middot;{" "}
              {date}
            </CardDescription>
          </div>
          <SentimentBadge sentiment={intelligence.sentiment as Sentiment} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {intelligence.topics.slice(0, 4).map((topic) => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
          {intelligence.action_items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {intelligence.action_items.length} action item
              {intelligence.action_items.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
