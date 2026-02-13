"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meeting Prep Brief</CardTitle>
          <CardDescription>Generating brief for {clientName}...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Not yet generated
  if (!brief) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meeting Prep Brief</CardTitle>
          <CardDescription>
            Generate an AI-powered briefing document before your next call with{" "}
            {clientName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          <Button onClick={generate}>Generate Brief</Button>
        </CardContent>
      </Card>
    );
  }

  // Show the brief
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Meeting Prep Brief — {clientName}
            </CardTitle>
            <CardDescription>
              AI-generated briefing based on your intelligence data
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generate}>
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Summary</h3>
          <p className="text-sm text-muted-foreground">{brief.summary}</p>
        </div>

        {/* Recent Highlights */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Recent Highlights</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {brief.recent_highlights.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Open Risks */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Open Risks</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {brief.open_risks.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Key Topics */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Key Topics</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {brief.key_topics.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Talking Points */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Talking Points</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {brief.talking_points.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
