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
  const supabase = createServerClient();
  const result: ProcessResult = { processed: 0, errors: 0, error_messages: [] };

  const afterTimestamp = source.last_synced_at
    ? Math.floor(new Date(source.last_synced_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - source.sync_interval_minutes * 60;

  const transcripts = await fetchRecentTranscripts(afterTimestamp);

  for (const transcript of transcripts) {
    try {
      // Skip if we've already processed this document
      const { data: existing } = await supabase
        .from("processing_queue")
        .select("id")
        .eq("source", "google_drive")
        .eq("source_id", transcript.id)
        .limit(1)
        .single();

      if (existing) continue;

      const queueItem: Partial<ProcessingQueueItem> = {
        source: "google_drive",
        source_id: transcript.id,
        knowledge_source_id: source.id,
        raw_content: transcript.content,
        status: "processing",
      };

      const { data: queue } = await supabase
        .from("processing_queue")
        .insert(queueItem)
        .select()
        .single();

      const intelligence = await extractTranscriptIntelligence(
        transcript.content
      );

      if (intelligence && queue) {
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
            processed_at: new Date().toISOString(),
          })
          .eq("id", queue.id);

        result.processed++;
      }
    } catch (err) {
      result.errors++;
      result.error_messages.push(
        `Transcript ${transcript.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

registerProcessor("google_drive", processBatch);

export { processBatch };
