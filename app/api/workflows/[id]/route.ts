import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/workflows/:id — fetch a single workflow template.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`GET /api/workflows/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch workflow template" },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/:id — update a workflow template.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { name, description, steps } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (steps !== undefined) updates.steps = steps;

    const { data, error } = await supabase
      .from("workflow_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`PATCH /api/workflows/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update workflow template" },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/:id — delete a workflow template.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("workflow_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/workflows/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete workflow template" },
      { status: 500 }
    );
  }
}
