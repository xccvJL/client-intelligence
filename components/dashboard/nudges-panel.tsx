"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { Nudge } from "@/lib/types";

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

export function NudgesPanel() {
  const { getPrompt, getRequestHeaders } = useTeamContext();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNudges = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDismissed(new Set());

    try {
      const res = await fetch("/api/nudges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getRequestHeaders(),
        },
        body: JSON.stringify({ systemPrompt: getPrompt("nudges") }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load nudges");
        return;
      }

      setNudges(json.data ?? []);
    } catch {
      setError("Failed to reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getPrompt, getRequestHeaders]);

  useEffect(() => {
    fetchNudges();
  }, [fetchNudges]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  const visibleNudges = nudges.filter((n) => !dismissed.has(n.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI Nudges</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNudges}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="h-5 w-14 bg-muted rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && visibleNudges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No nudges right now — you&apos;re all caught up!
          </p>
        )}

        {!loading && !error && visibleNudges.length > 0 && (
          <div className="space-y-3">
            {visibleNudges.map((nudge) => (
              <div
                key={nudge.id}
                className="flex items-start gap-3 rounded-md border px-3 py-2"
              >
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${priorityColors[nudge.priority] ?? ""}`}
                >
                  {nudge.priority}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{nudge.message}</p>
                  <Link
                    href={`/dashboard/accounts/${nudge.account_id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {nudge.account_name}
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => dismiss(nudge.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
