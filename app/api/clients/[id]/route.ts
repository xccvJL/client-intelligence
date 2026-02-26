import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/clients/[id] — fetch a single client with their intelligence count.
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
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Also fetch the intelligence count for this client
    const { count } = await supabase
      .from("intelligence")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id);

    return NextResponse.json({
      data: { ...data, intelligence_count: count ?? 0 },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`GET /api/clients/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] — update a client's info.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const body = await request.json();
    const { name, domain, contacts, tags, status } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (domain !== undefined) updates.domain = domain;
    if (contacts !== undefined) updates.contacts = contacts;
    if (tags !== undefined) updates.tags = tags;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`PATCH /api/clients/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}
