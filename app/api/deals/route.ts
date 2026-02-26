import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/deals — list deals with optional filters.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client_id");
  const stage = searchParams.get("stage");

  try {
    let query = supabase
      .from("deals")
      .select("*, clients(name)");

    if (clientId) query = query.eq("client_id", clientId);
    if (stage) query = query.eq("stage", stage);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
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
    const body = await request.json();
    const { client_id, title, stage, amount, close_date, notes, created_by } =
      body;

    if (!client_id || !title) {
      return NextResponse.json(
        { error: "client_id and title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("deals")
      .insert({
        client_id,
        title,
        stage: stage ?? "lead",
        amount: amount ?? null,
        close_date: close_date ?? null,
        notes: notes ?? null,
        created_by: created_by ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add the deal creator as an "owner" of this account.
    // Uses upsert so it silently skips if they already have access.
    if (created_by && client_id) {
      await supabase
        .from("account_members")
        .upsert(
          { client_id, team_member_id: created_by, role: "owner" },
          { onConflict: "client_id,team_member_id" }
        );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/deals failed:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
