"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PrepBrief, Intelligence } from "@/lib/types";

interface MeetingPrepProps {
  clientId: string;
  clientName: string;
  intelligence: Intelligence[];
}

export function MeetingPrep({
  clientId,
  clientName,
  intelligence,
}: MeetingPrepProps) {
  const [brief, setBrief] = useState<PrepBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/prep-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intelligence, clientName }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to generate brief");
        return;
      }

      setBrief(json.data);
    } catch {
      setError("Failed to reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Meeting Prep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {brief
              ? `Meeting Prep Brief — ${clientName}`
              : "Meeting Prep Brief"}
          </DialogTitle>
        </DialogHeader>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Generating brief for {clientName}...
            </p>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Not yet generated */}
        {!loading && !brief && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Generate an AI-powered briefing document before your next call
              with {clientName}.
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button onClick={generate}>Generate Brief</Button>
          </div>
        )}

        {/* Show the brief */}
        {!loading && brief && (
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              AI-generated briefing based on your intelligence data
            </p>

            <div>
              <h3 className="text-sm font-semibold mb-1">Summary</h3>
              <p className="text-sm text-muted-foreground">{brief.summary}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Recent Highlights</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {brief.recent_highlights.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Open Risks</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {brief.open_risks.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Key Topics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {brief.key_topics.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Talking Points</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {brief.talking_points.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={generate}>
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
