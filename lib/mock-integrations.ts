import type { Integration, SyncedEmail, CalendarEvent } from "./types";

// Mock data for the Email/Calendar Sync UI.
// Shows what the integration will look like once connected.

export const mockIntegrations: Integration[] = [
  {
    id: "int-1",
    name: "Gmail",
    provider: "google",
    status: "disconnected",
    last_synced_at: null,
    icon: "mail",
  },
  {
    id: "int-2",
    name: "Google Calendar",
    provider: "google",
    status: "disconnected",
    last_synced_at: null,
    icon: "calendar",
  },
  {
    id: "int-3",
    name: "Gemini AI",
    provider: "google",
    status: "disconnected",
    last_synced_at: null,
    icon: "sparkles",
  },
];

export const mockSyncedEmails: SyncedEmail[] = [
  {
    id: "email-1",
    subject: "Re: Q2 Renewal Timeline",
    from: "jane@acme.com",
    to: ["sarah@thrive.com"],
    snippet: "Hi Sarah, I've reviewed the expanded scope proposal and we're ready to move forward. Let's schedule a call this week to finalize the SOW...",
    date: "2026-02-15T14:30:00Z",
    matched_account_id: "1",
    matched_account_name: "Acme Corp",
  },
  {
    id: "email-2",
    subject: "Budget Review Follow-up",
    from: "finance@globex.com",
    to: ["sarah@thrive.com", "mike@thrive.com"],
    snippet: "Following up on our quarterly budget review discussion. We have some concerns about the Q3 projections that we'd like to address...",
    date: "2026-02-14T11:00:00Z",
    matched_account_id: "2",
    matched_account_name: "Globex Inc",
  },
  {
    id: "email-3",
    subject: "Onboarding Progress Update",
    from: "contact@umbrella.co",
    to: ["mike@thrive.com"],
    snippet: "Quick update on our onboarding progress. We've connected our Google Business Profile and are working through the platform integrations...",
    date: "2026-02-13T09:15:00Z",
    matched_account_id: "4",
    matched_account_name: "Umbrella Co",
  },
  {
    id: "email-4",
    subject: "New Point of Contact Introduction",
    from: "hr@initech.com",
    to: ["sarah@thrive.com"],
    snippet: "I wanted to introduce you to our new project lead, David Park. He'll be taking over from the previous POC starting next week...",
    date: "2026-02-12T16:45:00Z",
    matched_account_id: "3",
    matched_account_name: "Initech",
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "cal-1",
    title: "Acme Corp — Q2 Renewal Discussion",
    start: "2026-02-17T10:00:00Z",
    end: "2026-02-17T11:00:00Z",
    attendees: ["sarah@thrive.com", "jane@acme.com", "bob@acme.com"],
    matched_account_id: "1",
    matched_account_name: "Acme Corp",
    location: "Google Meet",
  },
  {
    id: "cal-2",
    title: "Globex Inc — Quarterly Review",
    start: "2026-02-18T14:00:00Z",
    end: "2026-02-18T15:00:00Z",
    attendees: ["sarah@thrive.com", "mike@thrive.com", "finance@globex.com"],
    matched_account_id: "2",
    matched_account_name: "Globex Inc",
    location: "Google Meet",
  },
  {
    id: "cal-3",
    title: "Umbrella Co — Onboarding Check-in",
    start: "2026-02-19T09:00:00Z",
    end: "2026-02-19T09:30:00Z",
    attendees: ["mike@thrive.com", "contact@umbrella.co"],
    matched_account_id: "4",
    matched_account_name: "Umbrella Co",
    location: "Phone",
  },
  {
    id: "cal-4",
    title: "Team Standup",
    start: "2026-02-17T09:00:00Z",
    end: "2026-02-17T09:15:00Z",
    attendees: ["sarah@thrive.com", "mike@thrive.com"],
    matched_account_id: null,
    matched_account_name: null,
    location: "Google Meet",
  },
];
