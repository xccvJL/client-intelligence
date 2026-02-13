import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { GeminiIntelligenceResponse } from "./types";

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

const EMAIL_PROMPT = `You are an intelligence analyst for a professional services firm.
Analyze the following email and extract structured intelligence.

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

const TRANSCRIPT_PROMPT = `You are an intelligence analyst for a professional services firm.
Analyze the following meeting transcript and extract structured intelligence.

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
  emailContent: string
): Promise<GeminiIntelligenceResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(EMAIL_PROMPT + emailContent);
  const text = result.response.text();
  return parseGeminiResponse(text);
}

// Send a meeting transcript to Gemini and get structured intelligence back
export async function extractTranscriptIntelligence(
  transcriptContent: string
): Promise<GeminiIntelligenceResponse | null> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(TRANSCRIPT_PROMPT + transcriptContent);
  const text = result.response.text();
  return parseGeminiResponse(text);
}
