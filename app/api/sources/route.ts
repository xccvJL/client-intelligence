import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/sources — list all knowledge sources
export async function GET() {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/sources failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST /api/sources — create a new knowledge source
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { name, source_type, enabled, configuration, sync_interval_minutes } =
      body;

    if (!name || !source_type) {
      return NextResponse.json(
        { error: "Name and source_type are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("knowledge_sources")
      .insert({
        name,
        source_type,
        enabled: enabled ?? true,
        configuration: configuration ?? {},
        sync_interval_minutes: sync_interval_minutes ?? 60,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/sources failed:", err);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
