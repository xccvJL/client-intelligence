import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/tasks/[id] — fetch a single task.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

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

    await requireClientAccess(teamMember.id, data.client_id);

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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
    const { teamMember } = await requireAuth(request);

    const { data: existingTask, error: existingTaskError } = await supabase
      .from("tasks")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingTaskError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await requireClientAccess(teamMember.id, existingTask.client_id);

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      assigned_role,
      due_date,
      workflow_template_id,
      source,
    } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;
    if (assigned_role !== undefined) updates.assigned_role = assigned_role;
    if (due_date !== undefined) updates.due_date = due_date;
    if (workflow_template_id !== undefined) updates.workflow_template_id = workflow_template_id;
    if (source !== undefined) updates.source = source;

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
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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
    const { teamMember } = await requireAuth(request);

    const { data: existingTask, error: existingTaskError } = await supabase
      .from("tasks")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingTaskError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await requireClientAccess(teamMember.id, existingTask.client_id);

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`DELETE /api/tasks/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
