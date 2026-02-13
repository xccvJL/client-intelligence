import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/intelligence/[id] — fetch a single intelligence entry with full details.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
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

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`GET /api/intelligence/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch intelligence entry" },
      { status: 500 }
    );
  }
}
