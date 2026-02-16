"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardBriefingItem } from "@/lib/types";

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

interface DashboardBriefingProps {
  summaryText: string;
}

export function DashboardBriefing({ summaryText }: DashboardBriefingProps) {
  const [items, setItems] = useState<DashboardBriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBriefing() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryText }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load briefing");
        return;
      }

      setItems(json.data ?? []);
    } catch {
      setError("Failed to reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">What Matters Today</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBriefing}
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
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nothing urgent today — you&apos;re in good shape!
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border px-3 py-2"
              >
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${priorityColors[item.priority] ?? ""}`}
                >
                  {item.priority}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <Link
                    href={`/dashboard/accounts/${item.account_id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item.account_name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
