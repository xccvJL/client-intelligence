import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/account-members — list members by account or by team member.
// ?client_id=X  → all members of an account
// ?team_member_id=X → all accounts a person can access
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client_id");
  const teamMemberId = searchParams.get("team_member_id");

  try {
    let query = supabase.from("account_members").select("*");

    if (clientId) query = query.eq("client_id", clientId);
    if (teamMemberId) query = query.eq("team_member_id", teamMemberId);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/account-members failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch account members" },
      { status: 500 }
    );
  }
}

// POST /api/account-members — add a member to an account.
// Uses upsert so auto-assignment won't create duplicates.
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { client_id, team_member_id, role } = body;

    if (!client_id || !team_member_id) {
      return NextResponse.json(
        { error: "client_id and team_member_id are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("account_members")
      .upsert(
        {
          client_id,
          team_member_id,
          role: role ?? "member",
        },
        { onConflict: "client_id,team_member_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/account-members failed:", err);
    return NextResponse.json(
      { error: "Failed to add account member" },
      { status: 500 }
    );
  }
}
