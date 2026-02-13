import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/queue — list processing queue items.
// Shows what's been processed, what's pending, and what failed.
export async function GET() {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("processing_queue")
      .select("*, clients(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/queue failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
