import { createServerClient } from "@/lib/supabase";
import { fetchNewEmails } from "@/lib/gmail";
import { extractEmailIntelligence } from "@/lib/gemini";
import { findClientForEmail } from "@/lib/matching";
import type {
  KnowledgeSource,
  Client,
  ProcessResult,
  ProcessingQueueItem,
  Intelligence,
} from "@/lib/types";
import { createTasksFromIntelligence, evaluateHealthSignals } from "@/lib/intelligence-actions";
import { registerProcessor } from "./types";

// Gmail processor — fetches new emails since the last sync,
// runs each one through Gemini AI, matches to a client, and
// stores the intelligence in the database.

async function processBatch(
  source: KnowledgeSource,
  _clients: Client[]
): Promise<ProcessResult> {
  const supabase = createServerClient();
  const result: ProcessResult = { processed: 0, errors: 0, error_messages: [] };

  // Figure out when we last synced this source
  const afterTimestamp = source.last_synced_at
    ? Math.floor(new Date(source.last_synced_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - source.sync_interval_minutes * 60;

  const emails = await fetchNewEmails(afterTimestamp);

  for (const email of emails) {
    try {
      // Add to processing queue
      const queueItem: Partial<ProcessingQueueItem> = {
        source: "gmail",
        source_id: email.id,
        knowledge_source_id: source.id,
        raw_content: JSON.stringify(email),
        status: "processing",
      };

      const { data: queue } = await supabase
        .from("processing_queue")
        .insert(queueItem)
        .select()
        .single();

      // Try to match to a client
      const client = await findClientForEmail(email.from);

      // Extract intelligence using Gemini AI
      const content = `From: ${email.from}\nTo: ${email.to}\nSubject: ${email.subject}\nDate: ${email.date}\n\n${email.body}`;
      const intelligence = await extractEmailIntelligence(content);

      if (intelligence && queue) {
        const entry: Partial<Intelligence> = {
          client_id: client?.id ?? null,
          source: "gmail",
          source_id: email.id,
          knowledge_source_id: source.id,
          summary: intelligence.summary,
          key_points: intelligence.key_points,
          sentiment: intelligence.sentiment,
          action_items: intelligence.action_items,
          people_mentioned: intelligence.people_mentioned,
          topics: intelligence.topics,
          raw_ai_response: intelligence as unknown as Record<string, unknown>,
        };

        const { data: saved } = await supabase
          .from("intelligence").insert(entry).select().single();

        if (saved) {
          await createTasksFromIntelligence(saved as Intelligence);
          await evaluateHealthSignals(saved as Intelligence);
        }

        await supabase
          .from("processing_queue")
          .update({
            status: "completed",
            client_id: client?.id ?? null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", queue.id);

        result.processed++;
      }
    } catch (err) {
      result.errors++;
      result.error_messages.push(
        `Email ${email.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

// Register this processor so the unified cron route can find it
registerProcessor("gmail", processBatch);

export { processBatch };
