import { createServerClient } from "@/lib/supabase";
import { fetchRecentTranscripts } from "@/lib/google-drive";
import { extractTranscriptIntelligence } from "@/lib/gemini";
import type {
  KnowledgeSource,
  Client,
  ProcessResult,
  ProcessingQueueItem,
  Intelligence,
} from "@/lib/types";
import { createTasksFromIntelligence, evaluateHealthSignals } from "@/lib/intelligence-actions";
import { registerProcessor } from "./types";

// Google Drive processor — fetches recent meeting transcripts,
// runs them through Gemini AI, and stores the intelligence.
// Transcripts usually need manual client assignment since they
// don't have a "from" address like emails do.

async function processBatch(
  source: KnowledgeSource,
  _clients: Client[]
): Promise<ProcessResult> {
  void _clients;
  const supabase = createServerClient();
  const result: ProcessResult = { processed: 0, errors: 0, error_messages: [] };

  const afterTimestamp = source.last_synced_at
    ? Math.floor(new Date(source.last_synced_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - source.sync_interval_minutes * 60;

  const transcripts = await fetchRecentTranscripts(afterTimestamp);

  for (const transcript of transcripts) {
    let queueId: string | null = null;

    try {
      // Idempotency guard: skip if transcript already became intelligence.
      const { data: existingIntel } = await supabase
        .from("intelligence")
        .select("id")
        .eq("source", "google_drive")
        .eq("source_id", transcript.id)
        .limit(1)
        .maybeSingle();

      if (existingIntel) continue;

      // Keep queue state consistent across retries.
      const { data: existingQueue } = await supabase
        .from("processing_queue")
        .select("id,status")
        .eq("source", "google_drive")
        .eq("source_id", transcript.id)
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
            raw_content: transcript.content,
          })
          .eq("id", queueId);
      } else {
        const queueItem: Partial<ProcessingQueueItem> = {
          source: "google_drive",
          source_id: transcript.id,
          knowledge_source_id: source.id,
          raw_content: transcript.content,
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

      const intelligence = await extractTranscriptIntelligence(
        transcript.content
      );

      if (!intelligence) {
        throw new Error("Gemini returned an invalid response payload");
      }

      const entry: Partial<Intelligence> = {
        client_id: null,
        source: "google_drive",
        source_id: transcript.id,
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
        `Transcript ${transcript.id}: ${errorMessage}`
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

registerProcessor("google_drive", processBatch);

export { processBatch };
