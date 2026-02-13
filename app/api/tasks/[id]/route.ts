import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/tasks/[id] — fetch a single task.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, clients(name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`GET /api/tasks/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] — update a task (status, assignee, etc.).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { title, description, status, priority, assignee_id, due_date } =
      body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;
    if (due_date !== undefined) updates.due_date = due_date;

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // When a task is reassigned, auto-add the new assignee to the account.
    if (assignee_id && data?.client_id) {
      await supabase
        .from("account_members")
        .upsert(
          { client_id: data.client_id, team_member_id: assignee_id, role: "member" },
          { onConflict: "client_id,team_member_id" }
        );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`PATCH /api/tasks/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] — delete a task.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/tasks/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
