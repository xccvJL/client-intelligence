import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  AuthError,
  getAccessibleClientIds,
  requireAuth,
} from "@/lib/auth";

// GET /api/alerts — list health alerts with optional filters.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client_id");
  const acknowledged = searchParams.get("acknowledged");

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
      .from("health_alerts")
      .select("*, clients(name)")
      .in("client_id", accessibleClientIds);

    if (clientId) query = query.eq("client_id", clientId);
    if (acknowledged === "true") query = query.eq("acknowledged", true);
    if (acknowledged === "false") query = query.eq("acknowledged", false);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/alerts failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
