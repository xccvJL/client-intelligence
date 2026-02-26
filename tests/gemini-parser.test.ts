import test from "node:test";
import assert from "node:assert/strict";
import { parseGeminiResponse } from "../lib/gemini-parser.ts";

test("parseGeminiResponse parses valid JSON", () => {
  const parsed = parseGeminiResponse(
    JSON.stringify({
      summary: "Client is happy with progress.",
      key_points: ["Renewal confirmed"],
      sentiment: "positive",
      action_items: [{ description: "Send recap", assignee: "Sarah", due_date: "2026-02-28" }],
      people_mentioned: ["Jane Smith"],
      topics: ["renewal"],
      client_name_guess: "Acme Corp",
    })
  );

  assert.ok(parsed);
  assert.equal(parsed.sentiment, "positive");
  assert.equal(parsed.key_points[0], "Renewal confirmed");
});

test("parseGeminiResponse handles fenced JSON", () => {
  const parsed = parseGeminiResponse(`\`\`\`json
{
  "summary": "Need follow-up on budget concerns.",
  "key_points": ["Budget concern raised"],
  "sentiment": "mixed",
  "action_items": [{"description":"Book review call","assignee":null,"due_date":null}],
  "people_mentioned": ["Bob Johnson"],
  "topics": ["budget"],
  "client_name_guess": "Globex Inc"
}
\`\`\``);

  assert.ok(parsed);
  assert.equal(parsed.client_name_guess, "Globex Inc");
  assert.equal(parsed.action_items.length, 1);
});

test("parseGeminiResponse returns null for invalid payloads", () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const parsed = parseGeminiResponse(
      JSON.stringify({
        summary: "Missing required fields",
        sentiment: "positive",
      })
    );

    assert.equal(parsed, null);
  } finally {
    console.error = originalError;
  }
});
