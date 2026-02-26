import type { SearchResult } from "./types";

// A flat array of all searchable items built from mock data.
// The search dialog filters this list based on the user's query.

export const mockSearchIndex: SearchResult[] = [
  // Accounts
  { id: "1", type: "account", title: "Acme Corp", subtitle: "acme.com · Active · Healthy", href: "/dashboard/accounts/1" },
  { id: "2", type: "account", title: "Globex Inc", subtitle: "globex.com · Active · At Risk", href: "/dashboard/accounts/2" },
  { id: "3", type: "account", title: "Initech", subtitle: "initech.com · Active · Healthy", href: "/dashboard/accounts/3" },
  { id: "4", type: "account", title: "Umbrella Co", subtitle: "umbrella.co · Active · Healthy", href: "/dashboard/accounts/4" },
  { id: "5", type: "account", title: "Waystar Royco", subtitle: "waystar.com · Archived · Churning", href: "/dashboard/accounts/5" },

  // Deals
  { id: "d1", type: "deal", title: "Umbrella Co — Initial Assessment", subtitle: "$15,000 · Lead", href: "/dashboard/accounts/4" },
  { id: "d2", type: "deal", title: "Globex Q3 Strategy Package", subtitle: "$45,000 · Proposal", href: "/dashboard/accounts/2" },
  { id: "d3", type: "deal", title: "Acme Corp — Expanded Scope", subtitle: "$80,000 · Proposal", href: "/dashboard/accounts/1" },
  { id: "d4", type: "deal", title: "Acme Corp — Annual Retainer", subtitle: "$120,000 · Active", href: "/dashboard/accounts/1" },
  { id: "d5", type: "deal", title: "Initech — Onboarding Support", subtitle: "$25,000 · Active", href: "/dashboard/accounts/3" },
  { id: "d6", type: "deal", title: "Globex Q1 Sprint", subtitle: "$30,000 · Closed Won", href: "/dashboard/accounts/2" },

  // Tasks
  { id: "t1", type: "task", title: "Send updated SOW by Friday", subtitle: "Acme Corp · High · Due Feb 14", href: "/dashboard/tasks" },
  { id: "t2", type: "task", title: "Schedule follow-up with VP", subtitle: "Acme Corp · Medium · Due Feb 18", href: "/dashboard/tasks" },
  { id: "t3", type: "task", title: "Prepare quarterly budget review deck", subtitle: "Globex Inc · High · In Progress", href: "/dashboard/tasks" },
  { id: "t4", type: "task", title: "Review resource allocation", subtitle: "Acme Corp · Medium · Done", href: "/dashboard/tasks" },
  { id: "t5", type: "task", title: "Send onboarding checklist to new POC", subtitle: "Initech · Low · To Do", href: "/dashboard/tasks" },

  // Contacts
  { id: "c1", type: "contact", title: "Jane Smith", subtitle: "VP of Operations · Acme Corp", href: "/dashboard/accounts/1" },
  { id: "c2", type: "contact", title: "Bob Johnson", subtitle: "Project Manager · Acme Corp", href: "/dashboard/accounts/1" },

  // Intelligence
  { id: "i1", type: "intelligence", title: "Q2 renewal timeline and expanded scope", subtitle: "Acme Corp · Email · Positive", href: "/dashboard/accounts/1" },
  { id: "i2", type: "intelligence", title: "Weekly sync — milestones and capacity concerns", subtitle: "Acme Corp · Transcript · Neutral", href: "/dashboard/accounts/1" },
  { id: "i3", type: "intelligence", title: "Client satisfaction with deliverables", subtitle: "Acme Corp · Email · Positive", href: "/dashboard/accounts/1" },
];
