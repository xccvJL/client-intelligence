import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  AuthError,
  getAccessibleClientIds,
  requireAuth,
  requireClientAccess,
} from "@/lib/auth";

// GET /api/deals — list deals with optional filters.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client_id");
  const stage = searchParams.get("stage");

  try {
    const { teamMember } = await requireAuth(request);
    const accessibleClientIds = await getAccessibleClientIds(teamMember.id);
    if (accessibleClientIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    if (clientId && !accessibleClientIds.includes(clientId)) {
      return NextResponse.json(
        { error: "Forbidden: no access to this account" },
        { status: 403 }
      );
    }

    let query = supabase
      .from("deals")
      .select("*, clients(name)")
      .in("client_id", accessibleClientIds);

    if (clientId) query = query.eq("client_id", clientId);
    if (stage) query = query.eq("stage", stage);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/deals failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST /api/deals — create a new deal.
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    const body = await request.json();
    const { client_id, title, stage, amount, close_date, notes, created_by } =
      body;

    if (!client_id || !title) {
      return NextResponse.json(
        { error: "client_id and title are required" },
        { status: 400 }
      );
    }

    await requireClientAccess(teamMember.id, client_id);

    const creatorId = created_by ?? teamMember.id;

    const { data, error } = await supabase
      .from("deals")
      .insert({
        client_id,
        title,
        stage: stage ?? "lead",
        amount: amount ?? null,
        close_date: close_date ?? null,
        notes: notes ?? null,
        created_by: creatorId,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add the deal creator as an "owner" of this account.
    // Uses upsert so it silently skips if they already have access.
    if (creatorId && client_id) {
      await supabase
        .from("account_members")
        .upsert(
          { client_id, team_member_id: creatorId, role: "owner" },
          { onConflict: "client_id,team_member_id" }
        );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/deals failed:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
