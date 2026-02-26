import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  AuthError,
  getAccessibleClientIds,
  requireAuth,
} from "@/lib/auth";
import type { NextRequest } from "next/server";

// GET /api/queue — list processing queue items.
// Shows what's been processed, what's pending, and what failed.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);
    const accessibleClientIds = await getAccessibleClientIds(teamMember.id);

    const { data, error } = await supabase
      .from("processing_queue")
      .select("*, clients(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const filtered = (data ?? []).filter(
      (row) => !row.client_id || accessibleClientIds.includes(row.client_id)
    );

    return NextResponse.json({ data: filtered });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/queue failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
