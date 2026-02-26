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
  void _clients;
  const supabase = createServerClient();
  const result: ProcessResult = { processed: 0, errors: 0, error_messages: [] };

  // Figure out when we last synced this source
  const afterTimestamp = source.last_synced_at
    ? Math.floor(new Date(source.last_synced_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - source.sync_interval_minutes * 60;

  const emails = await fetchNewEmails(afterTimestamp);

  for (const email of emails) {
    let queueId: string | null = null;

    try {
      // Idempotency guard: skip if this email was already converted into intelligence.
      const { data: existingIntel } = await supabase
        .from("intelligence")
        .select("id")
        .eq("source", "gmail")
        .eq("source_id", email.id)
        .limit(1)
        .maybeSingle();

      if (existingIntel) continue;

      // Keep queue state consistent across retries.
      const { data: existingQueue } = await supabase
        .from("processing_queue")
        .select("id,status")
        .eq("source", "gmail")
        .eq("source_id", email.id)
        .limit(1)
        .maybeSingle();

      if (existingQueue?.status === "completed") continue;

      if (existingQueue) {
        queueId = existingQueue.id as string;
        await supabase
          .from("processing_queue")
          .update({
            status: "processing",
            error_message: null,
            processed_at: null,
            raw_content: JSON.stringify(email),
          })
          .eq("id", queueId);
      } else {
        const queueItem: Partial<ProcessingQueueItem> = {
          source: "gmail",
          source_id: email.id,
          knowledge_source_id: source.id,
          raw_content: JSON.stringify(email),
          status: "processing",
        };

        const { data: queue, error: queueError } = await supabase
          .from("processing_queue")
          .insert(queueItem)
          .select("id")
          .single();

        if (queueError || !queue) {
          throw queueError ?? new Error("Failed to create queue item");
        }

        queueId = queue.id as string;
      }

      // Try to match to a client
      const client = await findClientForEmail(email.from);

      // Extract intelligence using Gemini AI
      const content = `From: ${email.from}\nTo: ${email.to}\nSubject: ${email.subject}\nDate: ${email.date}\n\n${email.body}`;
      const intelligence = await extractEmailIntelligence(content);

      if (!intelligence) {
        throw new Error("Gemini returned an invalid response payload");
      }

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

      const { data: saved, error: saveError } = await supabase
        .from("intelligence")
        .insert(entry)
        .select()
        .single();

      if (saveError) throw saveError;
      if (!saved) throw new Error("Failed to persist intelligence entry");

      await createTasksFromIntelligence(saved as Intelligence);
      await evaluateHealthSignals(saved as Intelligence);

      if (queueId) {
        await supabase
          .from("processing_queue")
          .update({
            status: "completed",
            client_id: client?.id ?? null,
            processed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", queueId);
      }

      result.processed++;
    } catch (err) {
      result.errors++;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      result.error_messages.push(
        `Email ${email.id}: ${errorMessage}`
      );

      if (queueId) {
        await supabase
          .from("processing_queue")
          .update({
            status: "failed",
            error_message: errorMessage,
            processed_at: new Date().toISOString(),
          })
          .eq("id", queueId);
      }
    }
  }

  return result;
}

// Register this processor so the unified cron route can find it
registerProcessor("gmail", processBatch);

export { processBatch };
