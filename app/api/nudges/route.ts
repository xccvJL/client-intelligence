import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateNudges } from "@/lib/gemini";
import { AuthError, getAccessibleClientIds, requireAuth } from "@/lib/auth";

// GET /api/nudges — generate proactive action suggestions across all accounts
export async function GET() {
  try {
    return NextResponse.json(
      { error: "Use POST /api/nudges for authenticated requests" },
      { status: 405 }
    );
  } catch (err) {
    console.error("GET /api/nudges failed:", err);
    return NextResponse.json(
      { error: "Failed to generate nudges" },
      { status: 500 }
    );
  }
}

// POST /api/nudges — accepts a custom systemPrompt
export async function POST(request: NextRequest) {
  try {
    const { teamMember } = await requireAuth(request);
    const { systemPrompt } = (await request.json()) as {
      systemPrompt?: string;
    };

    const supabase = createServerClient();
    const accessibleClientIds = await getAccessibleClientIds(teamMember.id);

    if (accessibleClientIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, status, updated_at")
      .in("id", accessibleClientIds)
      .eq("status", "active");

    if (clientsError) throw clientsError;

    const { data: healthRecords } = await supabase
      .from("client_health")
      .select("client_id, status")
      .in("client_id", accessibleClientIds);

    const { data: deals } = await supabase
      .from("deals")
      .select("client_id, stage, updated_at")
      .in("client_id", accessibleClientIds)
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
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/nudges failed:", err);
    return NextResponse.json(
      { error: "Failed to generate nudges" },
      { status: 500 }
    );
  }
}
