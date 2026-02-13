import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/team-members — list all team members.
// Used for assignee dropdowns in task and deal forms.
// Optional ?role= filter to get only members with a specific role.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const role = request.nextUrl.searchParams.get("role");

  try {
    let query = supabase
      .from("team_members")
      .select("*")
      .order("name", { ascending: true });

    if (role) query = query.eq("role", role);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/team-members failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
