import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendOpsAlert } from "@/lib/ops-alerts";
import { constantTimeEqual } from "@/lib/security";
import { processorRegistry } from "@/lib/processors";
import type { KnowledgeSource, Client } from "@/lib/types";

// Unified cron entry point — runs on a schedule and processes ALL
// enabled knowledge sources. For each source, it checks whether
// enough time has passed since the last sync (based on sync_interval_minutes),
// then dispatches to the correct processor module.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!constantTimeEqual(providedSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const runId = `run-${Date.now()}`;
  const startedAt = new Date().toISOString();

  try {
    // Get all enabled knowledge sources
    const { data: sources, error: sourcesError } = await supabase
      .from("knowledge_sources")
      .select("*")
      .eq("enabled", true);

    if (sourcesError) throw sourcesError;

    // Get all clients (processors need them for matching)
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*");

    if (clientsError) throw clientsError;

    const allClients = (clients ?? []) as Client[];
    const results: Record<
      string,
      { processed: number; errors: number; skipped?: boolean; error_message?: string }
    > = {};

    for (const source of (sources ?? []) as KnowledgeSource[]) {
      // Check if this source is due for a sync based on its interval
      if (source.last_synced_at) {
        const lastSync = new Date(source.last_synced_at).getTime();
        const intervalMs = source.sync_interval_minutes * 60 * 1000;
        const now = Date.now();

        if (now - lastSync < intervalMs) {
          results[source.name] = { processed: 0, errors: 0, skipped: true };
          continue;
        }
      }

      // Find the processor for this source type
      const processor = processorRegistry[source.source_type];

      if (!processor) {
        results[source.name] = { processed: 0, errors: 1 };
        console.error(`No processor registered for source type: ${source.source_type}`);
        continue;
      }

      try {
        const result = await processor(source, allClients);

        // Update the last_synced_at timestamp
        await supabase
          .from("knowledge_sources")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", source.id);

        // Log the sync
        await supabase.from("sync_logs").insert({
          knowledge_source_id: source.id,
          status: result.errors > 0 ? "error" : "success",
          items_processed: result.processed,
          error_message:
            result.error_messages.length > 0
              ? `[${runId}] ${result.error_messages.join("; ")}`
              : null,
        });

        results[source.name] = {
          processed: result.processed,
          errors: result.errors,
        };
      } catch (err) {
        console.error(`Processor failed for ${source.name}:`, err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        await supabase.from("sync_logs").insert({
          knowledge_source_id: source.id,
          status: "error",
          items_processed: 0,
          error_message: `[${runId}] ${errorMessage}`,
        });

        await sendOpsAlert({
          event: "source_processor_failure",
          severity: "error",
          message: `Source processor failed for ${source.name}`,
          details: { run_id: runId, source_id: source.id, source_name: source.name, error: errorMessage },
        });

        results[source.name] = { processed: 0, errors: 1, error_message: errorMessage };
      }
    }

    return NextResponse.json({
      success: true,
      run_id: runId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("Cron process-sources failed:", err);
    await sendOpsAlert({
      event: "cron_process_sources_failure",
      severity: "error",
      message: "Cron source processing failed before completion",
      details: {
        run_id: runId,
        error: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
