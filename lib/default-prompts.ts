// Default AI system prompt definitions.
// Each prompt has two conceptual parts:
//   1. The "system instruction" (editable) — defines the AI's role and behavior
//   2. The "format/data section" (not editable) — tells the AI what JSON to return
//      and injects the actual data (lives in gemini.ts)
//
// Only the system instruction is stored here and exposed in Settings.

export interface PromptDefinition {
  key: string;
  label: string;
  description: string;
  defaultPrompt: string;
}

export const defaultPrompts: PromptDefinition[] = [
  {
    key: "email_extraction",
    label: "Email Intelligence",
    description: "Extracts structured intelligence (summary, action items, sentiment) from an email.",
    defaultPrompt:
      "You are an intelligence analyst for a professional services firm. Analyze the following email and extract structured intelligence.",
  },
  {
    key: "transcript_extraction",
    label: "Transcript Intelligence",
    description: "Extracts structured intelligence from a meeting transcript.",
    defaultPrompt:
      "You are an intelligence analyst for a professional services firm. Analyze the following meeting transcript and extract structured intelligence.",
  },
  {
    key: "account_qa",
    label: "Account Q&A",
    description: "Answers questions about an account using only the available intelligence data.",
    defaultPrompt:
      "You are an account intelligence assistant for a professional services firm. Use ONLY the account data below to answer the user's question. If the data doesn't contain enough information, say so honestly.",
  },
  {
    key: "meeting_prep",
    label: "Meeting Prep Brief",
    description: "Generates a structured briefing document to prepare for a client call.",
    defaultPrompt:
      "You are preparing a meeting brief for an upcoming call. Based on the intelligence data below, create a structured brief.",
  },
  {
    key: "draft_response",
    label: "Draft Email Response",
    description: "Drafts a professional email reply based on an intelligence entry.",
    defaultPrompt:
      "You are drafting an email response for a professional services firm.",
  },
  {
    key: "lead_enrichment",
    label: "Lead Enrichment",
    description: "Researches a company and returns industry, size, likely needs, and approach suggestions.",
    defaultPrompt:
      "You are a sales intelligence analyst. Based on the company name and domain below, provide your best assessment of the company. Use your training knowledge \u2014 do not make up specifics you aren't reasonably confident about.",
  },
  {
    key: "nudges",
    label: "AI Nudges",
    description: "Suggests proactive actions across accounts based on health, activity, and deal stage.",
    defaultPrompt:
      "You are a proactive account manager assistant. Review the accounts below and suggest actionable nudges \u2014 things the team should do soon. Focus on accounts that haven't been contacted recently, are at-risk, have stalled deals, or need follow-up.",
  },
  {
    key: "account_brief",
    label: "Account Brief Generation",
    description: "Categorizes intelligence into 5 brief sections with concrete, specific facts.",
    defaultPrompt:
      "You are building an account brief. Based on the intelligence data below, categorize the insights into exactly 5 sections. Extract concrete, specific facts \u2014 not vague summaries.",
  },
  {
    key: "dashboard_briefing",
    label: "Daily Dashboard Briefing",
    description: "Identifies the 3\u20135 most important things to focus on today, prioritized by urgency.",
    defaultPrompt:
      "You are a proactive account management assistant. Review the current state of the business below and identify the 3-5 most important things the user should focus on TODAY. Prioritize by urgency and business impact.",
  },
];

// Lookup map for quick access by key
export const defaultPromptsMap: Record<string, PromptDefinition> =
  Object.fromEntries(defaultPrompts.map((p) => [p.key, p]));
