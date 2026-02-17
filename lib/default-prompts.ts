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
  hint: string;
  group: "everyday" | "advanced";
}

export const promptGroupLabels: Record<PromptDefinition["group"], string> = {
  everyday: "Everyday Features",
  advanced: "Background & Advanced",
};

// Everyday prompts first, then advanced
export const defaultPrompts: PromptDefinition[] = [
  // ── Everyday ──────────────────────────────────────────────
  {
    key: "dashboard_briefing",
    label: "Daily Dashboard Briefing",
    description: "Identifies the 3–5 most important things to focus on today, prioritized by urgency.",
    defaultPrompt:
      "You are a proactive account management assistant. Review the current state of the business below and identify the 3-5 most important things the user should focus on TODAY. Prioritize by urgency and business impact.",
    hint: "Try changing how many items it returns (e.g., 'Give me exactly 3') or what it prioritizes (e.g., 'Focus on revenue at risk').",
    group: "everyday",
  },
  {
    key: "nudges",
    label: "AI Nudges",
    description: "Suggests proactive actions across accounts based on health, activity, and deal stage.",
    defaultPrompt:
      "You are a proactive account manager assistant. Review the accounts below and suggest actionable nudges \u2014 things the team should do soon. Focus on accounts that haven't been contacted recently, are at-risk, have stalled deals, or need follow-up.",
    hint: "Change what it prioritizes \u2014 e.g., 'Focus only on accounts with upcoming renewals' or 'Be more aggressive with follow-up suggestions.'",
    group: "everyday",
  },
  {
    key: "meeting_prep",
    label: "Meeting Prep Brief",
    description: "Generates a structured briefing document to prepare for a client call.",
    defaultPrompt:
      "You are preparing a meeting brief for an upcoming call. Based on the intelligence data below, create a structured brief.",
    hint: "Try adjusting the tone (e.g., 'Be concise and direct') or tell it to emphasize specific areas like risks or opportunities.",
    group: "everyday",
  },
  {
    key: "account_qa",
    label: "Account Q&A",
    description: "Answers questions about an account using only the available intelligence data.",
    defaultPrompt:
      "You are an account intelligence assistant for a professional services firm. Use ONLY the account data below to answer the user's question. If the data doesn't contain enough information, say so honestly.",
    hint: "Adjust how it responds \u2014 e.g., 'Answer in bullet points' or 'Always suggest a next step.'",
    group: "everyday",
  },
  {
    key: "account_brief",
    label: "Account Brief Generation",
    description: "Categorizes intelligence into 5 brief sections with concrete, specific facts.",
    defaultPrompt:
      "You are building an account brief. Based on the intelligence data below, categorize the insights into exactly 5 sections. Extract concrete, specific facts \u2014 not vague summaries.",
    hint: "Change the number of sections or tell it what to focus on \u2014 e.g., 'Add a section for competitive landscape' or 'Keep each section to 2\u20133 bullets.'",
    group: "everyday",
  },
  // ── Advanced ──────────────────────────────────────────────
  {
    key: "email_extraction",
    label: "Email Intelligence",
    description: "Extracts structured intelligence (summary, action items, sentiment) from an email.",
    defaultPrompt:
      "You are an intelligence analyst for a professional services firm. Analyze the following email and extract structured intelligence.",
    hint: "Tell it what matters most \u2014 e.g., 'Pay extra attention to deadlines and commitments' or 'Flag any pricing discussions.'",
    group: "advanced",
  },
  {
    key: "transcript_extraction",
    label: "Transcript Intelligence",
    description: "Extracts structured intelligence from a meeting transcript.",
    defaultPrompt:
      "You are an intelligence analyst for a professional services firm. Analyze the following meeting transcript and extract structured intelligence.",
    hint: "Guide what it looks for \u2014 e.g., 'Highlight objections and concerns raised by the client' or 'Summarize decisions made.'",
    group: "advanced",
  },
  {
    key: "lead_enrichment",
    label: "Lead Enrichment",
    description: "Researches a company and returns industry, size, likely needs, and approach suggestions.",
    defaultPrompt:
      "You are a sales intelligence analyst. Based on the company name and domain below, provide your best assessment of the company. Use your training knowledge \u2014 do not make up specifics you aren't reasonably confident about.",
    hint: "Adjust the research focus \u2014 e.g., 'Emphasize technology stack and digital maturity' or 'Include likely budget range.'",
    group: "advanced",
  },
  {
    key: "draft_response",
    label: "Draft Email Response",
    description: "Drafts a professional email reply based on an intelligence entry.",
    defaultPrompt:
      "You are drafting an email response for a professional services firm.",
    hint: "Set the tone and style \u2014 e.g., 'Keep it under 3 sentences' or 'Use a warm, consultative tone.'",
    group: "advanced",
  },
];

// Lookup map for quick access by key
export const defaultPromptsMap: Record<string, PromptDefinition> =
  Object.fromEntries(defaultPrompts.map((p) => [p.key, p]));
