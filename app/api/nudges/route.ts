import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateNudges } from "@/lib/gemini";

// GET /api/nudges — generate proactive action suggestions across all accounts
export async function GET() {
  try {
    const supabase = createServerClient();

    // Fetch all active clients with their health and latest deal info
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, status, updated_at")
      .eq("status", "active");

    if (clientsError) throw clientsError;

    // Fetch health records for context
    const { data: healthRecords } = await supabase
      .from("client_health")
      .select("client_id, status");

    // Fetch latest deal stage per client
    const { data: deals } = await supabase
      .from("deals")
      .select("client_id, stage, updated_at")
      .order("updated_at", { ascending: false });

    // Build summary objects — one per account
    const healthMap = new Map(
      (healthRecords ?? []).map((h) => [h.client_id, h.status])
    );
    const dealMap = new Map(
      (deals ?? []).map((d) => [d.client_id, d.stage])
    );

    const summaries = (clients ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      health: healthMap.get(c.id) ?? "unknown",
      last_activity: c.updated_at,
      deal_stage: dealMap.get(c.id) ?? null,
    }));

    if (summaries.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const nudges = await generateNudges(summaries);

    return NextResponse.json({ data: nudges });
  } catch (err) {
    console.error("GET /api/nudges failed:", err);
    return NextResponse.json(
      { error: "Failed to generate nudges" },
      { status: 500 }
    );
  }
}

// POST /api/nudges — same as GET but accepts a custom systemPrompt
export async function POST(request: NextRequest) {
  try {
    const { systemPrompt } = (await request.json()) as {
      systemPrompt?: string;
    };

    const supabase = createServerClient();

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, status, updated_at")
      .eq("status", "active");

    if (clientsError) throw clientsError;

    const { data: healthRecords } = await supabase
      .from("client_health")
      .select("client_id, status");

    const { data: deals } = await supabase
      .from("deals")
      .select("client_id, stage, updated_at")
      .order("updated_at", { ascending: false });

    const healthMap = new Map(
      (healthRecords ?? []).map((h) => [h.client_id, h.status])
    );
    const dealMap = new Map(
      (deals ?? []).map((d) => [d.client_id, d.stage])
    );

    const summaries = (clients ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      health: healthMap.get(c.id) ?? "unknown",
      last_activity: c.updated_at,
      deal_stage: dealMap.get(c.id) ?? null,
    }));

    if (summaries.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const nudges = await generateNudges(summaries, systemPrompt);

    return NextResponse.json({ data: nudges });
  } catch (err) {
    console.error("POST /api/nudges failed:", err);
    return NextResponse.json(
      { error: "Failed to generate nudges" },
      { status: 500 }
    );
  }
}
