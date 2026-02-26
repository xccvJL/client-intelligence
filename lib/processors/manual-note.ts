import type {
  KnowledgeSource,
  Client,
  ProcessResult,
} from "@/lib/types";
import { registerProcessor } from "./types";

// Manual notes processor — this source type doesn't auto-fetch anything.
// Notes are entered directly through the dashboard UI and saved to the
// database immediately. The processor is a no-op for cron runs, but we
// register it so the system doesn't throw an error if it's queried.

async function processBatch(
  _source: KnowledgeSource,
  _clients: Client[]
): Promise<ProcessResult> {
  // Manual notes are created through the API, not by a cron job.
  // Nothing to process automatically.
  return { processed: 0, errors: 0, error_messages: [] };
}

registerProcessor("manual_note", processBatch);

export { processBatch };
