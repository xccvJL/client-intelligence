import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/sources/[id] — fetch a single knowledge source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`GET /api/sources/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

// PATCH /api/sources/[id] — update a knowledge source (toggle, config, interval)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { name, enabled, configuration, sync_interval_minutes } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (enabled !== undefined) updates.enabled = enabled;
    if (configuration !== undefined) updates.configuration = configuration;
    if (sync_interval_minutes !== undefined)
      updates.sync_interval_minutes = sync_interval_minutes;

    const { data, error } = await supabase
      .from("knowledge_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`PATCH /api/sources/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}
