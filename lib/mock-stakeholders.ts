import type { Stakeholder } from "./types";

// 3-4 stakeholders per account with touchpoint histories.
// Built from the "people_mentioned" data that the AI already extracts.

export const mockStakeholders: Record<string, Stakeholder[]> = {
  // Account 1 — Acme Corp
  "1": [
    {
      id: "sh-1",
      account_id: "1",
      name: "Jane Smith",
      job_title: "VP of Operations",
      email: "jane@acme.com",
      role: "decision_maker",
      last_interaction_date: "2026-02-15T14:30:00Z",
      touchpoints: [
        { id: "tp-1", type: "email", summary: "Discussed Q2 renewal timeline and expanded scope", date: "2026-02-15T14:30:00Z", team_member_name: "Sarah Chen" },
        { id: "tp-2", type: "meeting", summary: "Kickoff meeting for expanded engagement", date: "2026-02-06T14:00:00Z", team_member_name: "Mike Torres" },
        { id: "tp-3", type: "email", summary: "Confirmed budget allocation for next fiscal year", date: "2026-02-03T10:00:00Z", team_member_name: "Sarah Chen" },
      ],
    },
    {
      id: "sh-2",
      account_id: "1",
      name: "Bob Johnson",
      job_title: "Project Manager",
      email: "bob@acme.com",
      role: "champion",
      last_interaction_date: "2026-02-13T10:00:00Z",
      touchpoints: [
        { id: "tp-4", type: "meeting", summary: "Weekly sync — flagged capacity concerns for Q2", date: "2026-02-13T10:00:00Z", team_member_name: "Sarah Chen" },
        { id: "tp-5", type: "email", summary: "Shared resource allocation spreadsheet", date: "2026-02-09T11:00:00Z", team_member_name: "Sarah Chen" },
      ],
    },
    {
      id: "sh-3",
      account_id: "1",
      name: "Tom Williams",
      job_title: "CFO",
      email: "tom@acme.com",
      role: "influencer",
      last_interaction_date: "2026-02-03T10:00:00Z",
      touchpoints: [
        { id: "tp-6", type: "meeting", summary: "Budget approval meeting — confirmed Q3 increase", date: "2026-02-03T10:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
  ],

  // Account 2 — Globex Inc
  "2": [
    {
      id: "sh-4",
      account_id: "2",
      name: "Lisa Park",
      job_title: "Director of Marketing",
      email: "lisa@globex.com",
      role: "decision_maker",
      last_interaction_date: "2026-02-08T14:00:00Z",
      touchpoints: [
        { id: "tp-7", type: "meeting", summary: "Strategy review — discussed Q3 engagement areas", date: "2026-02-08T14:00:00Z", team_member_name: "Sarah Chen" },
        { id: "tp-8", type: "email", summary: "Approved Q1 Sprint deliverables", date: "2026-01-15T10:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
    {
      id: "sh-5",
      account_id: "2",
      name: "David Kim",
      job_title: "Finance Manager",
      email: "finance@globex.com",
      role: "blocker",
      last_interaction_date: "2026-02-14T11:00:00Z",
      touchpoints: [
        { id: "tp-9", type: "email", summary: "Raised concerns about Q3 budget projections", date: "2026-02-14T11:00:00Z", team_member_name: "Sarah Chen" },
        { id: "tp-10", type: "meeting", summary: "Quarterly budget review — requested cost justification", date: "2026-02-01T14:00:00Z", team_member_name: "Sarah Chen" },
      ],
    },
    {
      id: "sh-6",
      account_id: "2",
      name: "Amy Chen",
      job_title: "Marketing Coordinator",
      email: "amy@globex.com",
      role: "end_user",
      last_interaction_date: "2026-02-05T09:00:00Z",
      touchpoints: [
        { id: "tp-11", type: "call", summary: "Onboarding call for new campaign tools", date: "2026-02-05T09:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
  ],

  // Account 3 — Initech
  "3": [
    {
      id: "sh-7",
      account_id: "3",
      name: "Rachel Green",
      job_title: "Operations Director",
      email: "rachel@initech.com",
      role: "decision_maker",
      last_interaction_date: "2026-02-04T11:00:00Z",
      touchpoints: [
        { id: "tp-12", type: "note", summary: "Discussed onboarding timeline and expectations", date: "2026-02-04T11:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
    {
      id: "sh-8",
      account_id: "3",
      name: "David Park",
      job_title: "Project Lead",
      email: "david@initech.com",
      role: "champion",
      last_interaction_date: "2026-02-12T16:45:00Z",
      touchpoints: [
        { id: "tp-13", type: "email", summary: "Introduction as new point of contact", date: "2026-02-12T16:45:00Z", team_member_name: "Sarah Chen" },
      ],
    },
  ],

  // Account 4 — Umbrella Co
  "4": [
    {
      id: "sh-9",
      account_id: "4",
      name: "Mark Stevens",
      job_title: "Owner",
      email: "contact@umbrella.co",
      role: "decision_maker",
      last_interaction_date: "2026-02-13T09:15:00Z",
      touchpoints: [
        { id: "tp-14", type: "email", summary: "Onboarding progress update — GBP connected", date: "2026-02-13T09:15:00Z", team_member_name: "Mike Torres" },
        { id: "tp-15", type: "meeting", summary: "Initial assessment call", date: "2026-02-11T11:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
    {
      id: "sh-10",
      account_id: "4",
      name: "Karen White",
      job_title: "Office Manager",
      email: "karen@umbrella.co",
      role: "end_user",
      last_interaction_date: "2026-02-11T11:00:00Z",
      touchpoints: [
        { id: "tp-16", type: "meeting", summary: "Joined initial assessment call", date: "2026-02-11T11:00:00Z", team_member_name: "Mike Torres" },
      ],
    },
  ],
};
