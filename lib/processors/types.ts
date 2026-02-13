import type { KnowledgeSource, Client, ProcessResult } from "@/lib/types";

// Every source processor implements this interface.
// To add a new source (e.g., Slack), create a new file that exports
// a function matching this signature, then register it in the registry.
export type SourceProcessor = (
  source: KnowledgeSource,
  clients: Client[]
) => Promise<ProcessResult>;

// Registry that maps source_type strings to their processor functions.
// The unified cron route looks up the right processor here.
// When you build a new source, import its processor and add it to this map.
export const processorRegistry: Record<string, SourceProcessor | undefined> = {};

export function registerProcessor(
  sourceType: string,
  processor: SourceProcessor
) {
  processorRegistry[sourceType] = processor;
}
