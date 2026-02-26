import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type {
  GeminiIntelligenceResponse,
  Intelligence,
  PrepBrief,
  DraftResponse,
  LeadEnrichment,
  Nudge,
  GeneratedAccountBriefResponse,
  DashboardBriefingItem,
  HealthStatus,
} from "./types";

// Initialize the Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Check your .env.local file.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Zod schema to validate the AI's JSON response — makes sure it matches
// the shape we expect, even if the model returns unexpected fields.
const intelligenceSchema = z.object({
  summary: z.string(),
  key_points: z.array(z.string()),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]),
  action_items: z.array(
    z.object({
      description: z.string(),
      assignee: z.string().nullable(),
      due_date: z.string().nullable(),
    })
  ),
  people_mentioned: z.array(z.string()),
  topics: z.array(z.string()),
  client_name_guess: z.string().nullable(),
});

// Prompt templates — these tell Gemini exactly what to extract and how
// to format the response.

// Default editable instructions — can be overridden via the systemPrompt parameter
const EMAIL_INSTRUCTION = `You are an intelligence analyst for a professional services firm. Analyze the following email and extract structured intelligence.`;

const EMAIL_FORMAT = `
Return ONLY valid JSON matching this exact shape:
{
  "summary": "2-3 sentence summary of the email",
  "key_points": ["array of key takeaways"],
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "action_items": [{"description": "...", "assignee": "name or null", "due_date": "ISO date or null"}],
  "people_mentioned": ["names of people referenced"],
  "topics": ["business topics discussed"],
  "client_name_guess": "best guess at the client/company name, or null"
}

EMAIL:
`;

const TRANSCRIPT_INSTRUCTION = `You are an intelligence analyst for a professional services firm. Analyze the following meeting transcript and extract structured intelligence.`;

const TRANSCRIPT_FORMAT = `
Return ONLY valid JSON matching this exact shape:
{
  "summary": "2-3 sentence summary of the meeting",
  "key_points": ["array of key takeaways"],
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "action_items": [{"description": "...", "assignee": "name or null", "due_date": "ISO date or null"}],
  "people_mentioned": ["names of participants and people referenced"],
  "topics": ["business topics discussed"],
  "client_name_guess": "best guess at the client/company name, or null"
}

TRANSCRIPT:
`;

// Parse and validate the model's JSON response using the zod schema.
// Returns null if the response isn't valid JSON or doesn't match the schema.
export function parseGeminiResponse(
  text: string
): GeminiIntelligenceResponse | null {
  try {
    // Strip markdown code fences if the model wraps its response
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validated = intelligenceSchema.parse(parsed);
    return validated;
  } catch {
    console.error("Failed to parse Gemini response:", text.slice(0, 200));
    return null;
  }
}

// Send an email to Gemini and get structured intelligence back
export async function extractEmailIntelligence(
  emailContent: string,
  systemPrompt?: string
): Promise<GeminiIntelligenceResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const instruction = systemPrompt ?? EMAIL_INSTRUCTION;
  const prompt = `${instruction}${EMAIL_FORMAT}${emailContent}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseGeminiResponse(text);
}

// Send a meeting transcript to Gemini and get structured intelligence back
export async function extractTranscriptIntelligence(
  transcriptContent: string,
  systemPrompt?: string
): Promise<GeminiIntelligenceResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const instruction = systemPrompt ?? TRANSCRIPT_INSTRUCTION;
  const prompt = `${instruction}${TRANSCRIPT_FORMAT}${transcriptContent}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseGeminiResponse(text);
}

// ===========================================
// AI-native features — 5 new functions
// ===========================================

// Helper: generic JSON parse for the new features (strips code fences, validates with Zod)
function parseJsonResponse<T>(text: string, schema: z.ZodSchema<T>): T | null {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  } catch {
    console.error("Failed to parse Gemini JSON response:", text.slice(0, 200));
    return null;
  }
}

// Format intelligence entries into a text block the AI can reason over.
function formatIntelligenceContext(intelligence: Intelligence[]): string {
  return intelligence
    .map(
      (entry) =>
        `[${entry.source.toUpperCase()} — ${entry.created_at}]\n` +
        `Summary: ${entry.summary}\n` +
        `Sentiment: ${entry.sentiment}\n` +
        `Key points: ${entry.key_points.join("; ")}\n` +
        `Topics: ${entry.topics.join(", ")}\n` +
        `Action items: ${entry.action_items.map((a) => a.description).join("; ") || "None"}`
    )
    .join("\n\n");
}

// 1. Account Q&A — answer a question using intelligence entries as context
export async function chatWithAccountContext(
  intelligence: Intelligence[],
  question: string,
  systemPrompt?: string
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = formatIntelligenceContext(intelligence);

  const instruction = systemPrompt ?? `You are an account intelligence assistant for a professional services firm.
Use ONLY the account data below to answer the user's question. If the data doesn't contain enough information, say so honestly.`;

  const prompt = `${instruction}

ACCOUNT DATA:
${context}

QUESTION: ${question}

Provide a concise, helpful answer in plain text.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 2. Meeting prep brief — structured briefing document for a client call
const prepBriefSchema = z.object({
  summary: z.string(),
  recent_highlights: z.array(z.string()),
  open_risks: z.array(z.string()),
  key_topics: z.array(z.string()),
  talking_points: z.array(z.string()),
});

export async function generatePrepBrief(
  intelligence: Intelligence[],
  clientName: string,
  systemPrompt?: string
): Promise<PrepBrief | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = formatIntelligenceContext(intelligence);

  const instruction = systemPrompt ?? `You are preparing a meeting brief for an upcoming call with ${clientName}.
Based on the intelligence data below, create a structured brief.`;

  const prompt = `${instruction}

Return ONLY valid JSON matching this exact shape:
{
  "summary": "2-3 sentence overview of the account relationship",
  "recent_highlights": ["array of recent positive developments"],
  "open_risks": ["array of concerns or risks to address"],
  "key_topics": ["topics likely to come up in the meeting"],
  "talking_points": ["suggested things to say or ask during the call"]
}

ACCOUNT DATA:
${context}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), prepBriefSchema);
}

// 3. Draft email response — create a reply to a specific intelligence entry
const draftResponseSchema = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.string(),
});

export async function generateDraftResponse(
  intelligence: Intelligence[],
  entryId: string,
  clientName: string,
  systemPrompt?: string
): Promise<DraftResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const entry = intelligence.find((e) => e.id === entryId);
  if (!entry) return null;

  const context = formatIntelligenceContext(intelligence);

  const instruction = systemPrompt ?? `You are drafting an email response for a professional services firm.`;

  const prompt = `${instruction}

The specific email/entry to respond to:
Summary: ${entry.summary}
Key points: ${entry.key_points.join("; ")}
Action items: ${entry.action_items.map((a) => a.description).join("; ") || "None"}

Full account context for ${clientName}:
${context}

Return ONLY valid JSON matching this exact shape:
{
  "subject": "Re: appropriate subject line",
  "body": "Full email body text, professional and helpful",
  "tone": "one-word description of the tone used (e.g. friendly, professional, reassuring)"
}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), draftResponseSchema);
}

// 4. Lead enrichment — research a company and return structured info
const leadEnrichmentSchema = z.object({
  industry: z.string(),
  company_size: z.string(),
  likely_needs: z.array(z.string()),
  suggested_approach: z.string(),
});

export async function enrichLead(
  companyName: string,
  domain: string,
  systemPrompt?: string
): Promise<LeadEnrichment | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const instruction = systemPrompt ?? `You are a sales intelligence analyst. Based on the company name and domain below,
provide your best assessment of the company. Use your training knowledge — do not make up specifics
you aren't reasonably confident about.`;

  const prompt = `${instruction}

Company: ${companyName}
Domain: ${domain}

Return ONLY valid JSON matching this exact shape:
{
  "industry": "primary industry or sector",
  "company_size": "estimated size (e.g. 'Small (1-50)', 'Mid-market (50-500)', 'Enterprise (500+)')",
  "likely_needs": ["array of likely business needs based on their industry"],
  "suggested_approach": "one paragraph on how to approach this lead"
}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), leadEnrichmentSchema);
}

// 5. Proactive nudges — generate action items across all accounts
interface AccountSummary {
  id: string;
  name: string;
  health: string;
  last_activity: string;
  deal_stage: string | null;
}

const nudgesSchema = z.array(
  z.object({
    id: z.string(),
    message: z.string(),
    account_name: z.string(),
    account_id: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    category: z.string(),
  })
);

export async function generateNudges(
  accountSummaries: AccountSummary[],
  systemPrompt?: string
): Promise<Nudge[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const summaryText = accountSummaries
    .map(
      (a) =>
        `- ${a.name} (ID: ${a.id}): health=${a.health}, last_activity=${a.last_activity}, deal_stage=${a.deal_stage ?? "none"}`
    )
    .join("\n");

  const instruction = systemPrompt ?? `You are a proactive account manager assistant. Review the accounts below and suggest
actionable nudges — things the team should do soon. Focus on accounts that haven't been contacted
recently, are at-risk, have stalled deals, or need follow-up.`;

  const prompt = `${instruction}

ACCOUNTS:
${summaryText}

Return ONLY a valid JSON array where each item matches this shape:
{
  "id": "unique string id (nudge-1, nudge-2, etc.)",
  "message": "specific actionable suggestion",
  "account_name": "name of the account",
  "account_id": "id of the account",
  "priority": "high" | "medium" | "low",
  "category": "category like 'follow-up', 'risk', 'opportunity', 'renewal'"
}

Return 3-8 nudges, prioritized by urgency.`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), nudgesSchema) ?? [];
}

// 6. Account brief generation — categorise intelligence into the 5 brief sections
const accountBriefSchema = z.object({
  key_context: z.array(z.string()),
  decisions: z.array(z.string()),
  budgets: z.array(z.string()),
  key_people: z.array(z.string()),
  risks: z.array(z.string()),
});

export async function generateAccountBrief(
  intelligence: Intelligence[],
  clientName: string,
  systemPrompt?: string
): Promise<GeneratedAccountBriefResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = formatIntelligenceContext(intelligence);

  const instruction = systemPrompt ?? `You are building an account brief for ${clientName}.
Based on the intelligence data below, categorize the insights into exactly 5 sections.
Extract concrete, specific facts — not vague summaries.`;

  const prompt = `${instruction}

Return ONLY valid JSON matching this exact shape:
{
  "key_context": ["important background facts about the account"],
  "decisions": ["decisions that have been made or need to be made"],
  "budgets": ["budget-related information, spend, costs, pricing"],
  "key_people": ["names and roles of important stakeholders"],
  "risks": ["risks, concerns, or red flags"]
}

Each array should contain 0-5 items. If there is no relevant information for a section, return an empty array.

ACCOUNT DATA:
${context}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), accountBriefSchema);
}

// 7. Dashboard briefing — identify the 3-5 most important things to focus on today
const dashboardBriefingSchema = z.array(
  z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    category: z.string(),
    account_name: z.string(),
    account_id: z.string(),
  })
);

export async function generateDashboardBriefing(
  summaryText: string,
  systemPrompt?: string
): Promise<DashboardBriefingItem[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const instruction = systemPrompt ?? `You are a proactive account management assistant. Review the current state of the business below
and identify the 3-5 most important things the user should focus on TODAY. Prioritize by urgency
and business impact. Think about overdue tasks, at-risk accounts, stalled deals, upcoming renewals,
and recent negative signals.`;

  const prompt = `${instruction}

CURRENT STATE:
${summaryText}

Return ONLY a valid JSON array where each item matches this shape:
{
  "title": "short action-oriented title (max 10 words)",
  "description": "1-2 sentence explanation of why this matters and what to do",
  "priority": "high" | "medium" | "low",
  "category": "one of: task, health, deal, renewal, follow-up",
  "account_name": "name of the related account",
  "account_id": "id of the related account"
}

Return 3-5 items, ordered by priority (highest first).`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text(), dashboardBriefingSchema) ?? [];
}

// 8. Health summary — generate a plain-text description of the account's health
interface HealthContext {
  status: HealthStatus;
  satisfaction_score: number;
  renewal_date: string | null;
  last_positive_signal: string | null;
  last_negative_signal: string | null;
  alerts: { severity: string; message: string }[];
}

export async function generateHealthSummary(
  intelligence: Intelligence[],
  clientName: string,
  healthContext: HealthContext,
  systemPrompt?: string
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const intelContext = formatIntelligenceContext(intelligence);

  const alertText = healthContext.alerts.length > 0
    ? healthContext.alerts.map((a) => `- [${a.severity}] ${a.message}`).join("\n")
    : "None";

  const instruction = systemPrompt ?? `You are an account health analyst for a professional services firm.
Write a concise 2-4 sentence summary of this account's current health. Focus on the overall relationship
status, key risks or strengths, and what needs attention. Be specific and actionable.`;

  const prompt = `${instruction}

ACCOUNT: ${clientName}
STATUS: ${healthContext.status}
SATISFACTION SCORE: ${healthContext.satisfaction_score}/10
RENEWAL DATE: ${healthContext.renewal_date ?? "Not set"}
LAST POSITIVE SIGNAL: ${healthContext.last_positive_signal ?? "None"}
LAST NEGATIVE SIGNAL: ${healthContext.last_negative_signal ?? "None"}

ACTIVE ALERTS:
${alertText}

RECENT INTELLIGENCE:
${intelContext}

Write a plain-text summary (no JSON, no markdown). Keep it to 2-4 sentences.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
