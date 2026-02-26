"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockCalendarEvents } from "@/lib/mock-integrations";

// Upcoming calendar events with attendees and matched clients.
// Demonstrates what the calendar sync will look like once connected.

function formatEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const day = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const startTime = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${startTime} – ${endTime}`;
}

interface CalendarPreviewProps {
  accountId?: string;
}

export function CalendarPreview({ accountId }: CalendarPreviewProps) {
  const events = accountId
    ? mockCalendarEvents.filter((e) => e.matched_account_id === accountId)
    : mockCalendarEvents;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Events</CardTitle>
        <CardDescription>
          Calendar events matched to client accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatEventTime(event.start, event.end)}
                    </p>
                  </div>
                  {event.matched_account_name && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 shrink-0">
                      {event.matched_account_name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {event.location && (
                    <span className="text-xs text-muted-foreground">
                      📍 {event.location}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    👥 {event.attendees.length} attendees
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
