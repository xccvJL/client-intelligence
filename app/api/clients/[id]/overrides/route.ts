import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/clients/[id]/overrides — list source overrides for a client.
// Returns which sources are overridden for this client, joined with
// the knowledge_sources table so the UI knows the source names.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const { data, error } = await supabase
      .from("client_source_overrides")
      .select("*, knowledge_sources(name, source_type, enabled)")
      .eq("client_id", id);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`GET /api/clients/${id}/overrides failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch overrides" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/overrides — create or update a source override.
// If an override already exists for this client + source combo, update it.
// Otherwise create a new one.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, clientId);

    const body = await request.json();
    const { knowledge_source_id, enabled, configuration_override } = body;

    if (!knowledge_source_id) {
      return NextResponse.json(
        { error: "knowledge_source_id is required" },
        { status: 400 }
      );
    }

    // Check if an override already exists for this combination
    const { data: existing } = await supabase
      .from("client_source_overrides")
      .select("id")
      .eq("client_id", clientId)
      .eq("knowledge_source_id", knowledge_source_id)
      .limit(1)
      .single();

    if (existing) {
      // Update the existing override
      const { data, error } = await supabase
        .from("client_source_overrides")
        .update({
          enabled: enabled ?? true,
          configuration_override: configuration_override ?? {},
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    // Create a new override
    const { data, error } = await supabase
      .from("client_source_overrides")
      .insert({
        client_id: clientId,
        knowledge_source_id,
        enabled: enabled ?? true,
        configuration_override: configuration_override ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`POST /api/clients/${clientId}/overrides failed:`, err);
    return NextResponse.json(
      { error: "Failed to create override" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/overrides — remove an override (revert to global default).
// Pass knowledge_source_id as a query parameter.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = createServerClient();
  const sourceId = request.nextUrl.searchParams.get("knowledge_source_id");

  if (!sourceId) {
    return NextResponse.json(
      { error: "knowledge_source_id query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, clientId);

    const { error } = await supabase
      .from("client_source_overrides")
      .delete()
      .eq("client_id", clientId)
      .eq("knowledge_source_id", sourceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`DELETE /api/clients/${clientId}/overrides failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete override" },
      { status: 500 }
    );
  }
}
