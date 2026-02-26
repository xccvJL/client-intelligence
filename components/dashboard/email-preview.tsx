"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSyncedEmails } from "@/lib/mock-integrations";

// Shows sample synced emails with client-matching badges.
// Demonstrates what the email sync will look like once connected.

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EmailPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Synced Emails</CardTitle>
        <CardDescription>
          Recent emails matched to client accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockSyncedEmails.map((email) => (
            <div key={email.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    From: {email.from}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {email.matched_account_name && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      {email.matched_account_name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(email.date)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                {email.snippet}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
