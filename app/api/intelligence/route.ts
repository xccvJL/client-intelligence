import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/intelligence — list intelligence entries with optional filters.
// The dashboard calls this to show the activity feed and client timelines.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  // Optional filters from query string
  const clientId = searchParams.get("client_id");
  const source = searchParams.get("source");
  const sentiment = searchParams.get("sentiment");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");

  try {
    let query = supabase
      .from("intelligence")
      .select("*, clients(name, domain)", { count: "exact" });

    if (clientId) query = query.eq("client_id", clientId);
    if (source) query = query.eq("source", source);
    if (sentiment) query = query.eq("sentiment", sentiment);

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (err) {
    console.error("GET /api/intelligence failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch intelligence" },
      { status: 500 }
    );
  }
}
