import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  AuthError,
  getAccessibleClientIds,
  requireAuth,
} from "@/lib/auth";

// GET /api/clients — list all clients.
// Optional query param: ?status=active or ?status=archived to filter.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    const accessibleClientIds = await getAccessibleClientIds(teamMember.id);
    if (accessibleClientIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("clients")
      .select("*")
      .in("id", accessibleClientIds)
      .order("name", { ascending: true });

    if (status === "active" || status === "archived") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/clients failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients — create a new client.
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    const body = await request.json();
    const { name, domain, contacts, tags } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: "Name and domain are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        domain,
        contacts: contacts ?? [],
        tags: tags ?? [],
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    // Creator gets owner-level access.
    await supabase.from("account_members").upsert(
      {
        client_id: data.id,
        team_member_id: teamMember.id,
        role: "owner",
      },
      { onConflict: "client_id,team_member_id" }
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/clients failed:", err);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
