import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/intelligence/[id] — fetch a single intelligence entry with full details.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data, error } = await supabase
      .from("intelligence")
      .select("*, clients(name, domain)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Intelligence entry not found" },
        { status: 404 }
      );
    }

    if (!data.client_id) {
      return NextResponse.json(
        { error: "Forbidden: entry is not assigned to an account" },
        { status: 403 }
      );
    }

    await requireClientAccess(teamMember.id, data.client_id);

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`GET /api/intelligence/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch intelligence entry" },
      { status: 500 }
    );
  }
}
