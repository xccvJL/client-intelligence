"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DraftResponseDialog } from "@/components/dashboard/draft-response-dialog";
import type { Intelligence } from "@/lib/types";

// Placeholder intelligence entry shape used in the account detail page.
// This matches the hardcoded data in the account page until real DB data is wired up.
interface IntelligenceEntry {
  id: string;
  summary: string;
  source: string;
  sentiment: string;
  date: string;
  topics: string[];
  actionItems: string[];
}

interface ClientIntelligenceProps {
  clientId: string;
  clientName: string;
  entries: IntelligenceEntry[];
  intelligence: Intelligence[];
}

// Client component wrapper for the Intelligence tab.
// Renders the same cards as before, but adds a "Draft Response" button on email entries.
export function ClientIntelligence({
  clientId,
  clientName,
  entries,
  intelligence,
}: ClientIntelligenceProps) {
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  function openDraft(entryId: string) {
    setSelectedEntryId(entryId);
    setDraftDialogOpen(true);
  }

  function getSourceLabel(source: string) {
    const normalized = source.trim().toLowerCase();
    if (normalized === "email" || normalized === "gmail") return "Email";
    if (
      normalized === "transcript" ||
      normalized === "google_drive" ||
      normalized === "drive"
    ) {
      return "Transcript";
    }
    if (normalized === "manual_note" || normalized === "note") return "Note";
    return source;
  }

  function isEmailSource(source: string) {
    const normalized = source.trim().toLowerCase();
    return normalized === "email" || normalized === "gmail";
  }

  return (
    <>
      {entries.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{item.summary}</CardTitle>
                <CardDescription>
                  {getSourceLabel(item.source)} &middot; {item.date}
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
            {isEmailSource(item.source) && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDraft(item.id)}
                >
                  Draft Response
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {selectedEntryId && (
        <DraftResponseDialog
          open={draftDialogOpen}
          onOpenChange={setDraftDialogOpen}
          clientId={clientId}
          clientName={clientName}
          entryId={selectedEntryId}
          intelligence={intelligence}
        />
      )}
    </>
  );
}
