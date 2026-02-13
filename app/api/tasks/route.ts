import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/tasks — list tasks with optional filters.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client_id");
  const assigneeId = searchParams.get("assignee_id");
  const status = searchParams.get("status");

  try {
    let query = supabase
      .from("tasks")
      .select("*, clients(name)");

    if (clientId) query = query.eq("client_id", clientId);
    if (assigneeId) query = query.eq("assignee_id", assigneeId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/tasks failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks — create a new task.
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const {
      client_id,
      title,
      description,
      priority,
      assignee_id,
      due_date,
      intelligence_id,
      source,
    } = body;

    if (!client_id || !title) {
      return NextResponse.json(
        { error: "client_id and title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        client_id,
        title,
        description: description ?? null,
        status: "todo",
        priority: priority ?? "medium",
        assignee_id: assignee_id ?? null,
        due_date: due_date ?? null,
        intelligence_id: intelligence_id ?? null,
        source: source ?? "manual",
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add the task assignee as a "member" of this account.
    // Uses upsert so it silently skips if they already have access.
    if (assignee_id && client_id) {
      await supabase
        .from("account_members")
        .upsert(
          { client_id, team_member_id: assignee_id, role: "member" },
          { onConflict: "client_id,team_member_id" }
        );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks failed:", err);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
