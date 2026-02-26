import { z } from "zod";

export interface GeminiIntelligenceResponse {
  summary: string;
  key_points: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  action_items: {
    description: string;
    assignee: string | null;
    due_date: string | null;
  }[];
  people_mentioned: string[];
  topics: string[];
  client_name_guess: string | null;
}

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

export function parseGeminiResponse(
  text: string
): GeminiIntelligenceResponse | null {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return intelligenceSchema.parse(parsed);
  } catch {
    console.error("Failed to parse Gemini response:", text.slice(0, 200));
    return null;
  }
}
