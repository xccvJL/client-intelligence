import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/clients/[id]/health — fetch the health record for a client.
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
      .from("client_health")
      .select("*")
      .eq("client_id", id)
      .single();

    if (error || !data) {
      // No health record yet — return a default
      return NextResponse.json({
        data: {
          client_id: id,
          status: "healthy",
          satisfaction_score: 7,
          renewal_date: null,
          last_positive_signal: null,
          last_negative_signal: null,
          notes: null,
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`GET /api/clients/${id}/health failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch health" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]/health — upsert the health record
// (create if none exists, update if it does).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const body = await request.json();
    const { status, satisfaction_score, renewal_date, notes } = body;

    // Check if a record exists
    const { data: existing } = await supabase
      .from("client_health")
      .select("id")
      .eq("client_id", id)
      .single();

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (satisfaction_score !== undefined) updates.satisfaction_score = satisfaction_score;
      if (renewal_date !== undefined) updates.renewal_date = renewal_date;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from("client_health")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      const { data, error } = await supabase
        .from("client_health")
        .insert({
          client_id: id,
          status: status ?? "healthy",
          satisfaction_score: satisfaction_score ?? 7,
          renewal_date: renewal_date ?? null,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`PUT /api/clients/${id}/health failed:`, err);
    return NextResponse.json(
      { error: "Failed to update health" },
      { status: 500 }
    );
  }
}
