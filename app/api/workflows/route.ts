import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth } from "@/lib/auth";

// GET /api/workflows — list all workflow templates.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  try {
    await requireAuth(request);
    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/workflows failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch workflow templates" },
      { status: 500 }
    );
  }
}

// POST /api/workflows — create a new workflow template.
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    await requireAuth(request);
    const body = await request.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "name and at least one step are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("workflow_templates")
      .insert({
        name,
        description: description ?? null,
        steps,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/workflows failed:", err);
    return NextResponse.json(
      { error: "Failed to create workflow template" },
      { status: 500 }
    );
  }
}
