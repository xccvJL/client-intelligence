import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { WorkflowStep } from "@/lib/types";

// POST /api/workflows/:id/apply — apply a workflow template to a client.
// Creates one task per step with calculated due dates and role assignments.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    // Fetch the workflow template
    const { data: template, error: templateError } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Workflow template not found" },
        { status: 404 }
      );
    }

    const steps: WorkflowStep[] = template.steps;
    const now = new Date();

    // Create one task per step
    const tasks = steps.map((step) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + step.due_in_days);

      return {
        client_id,
        title: step.title,
        description: step.description ?? null,
        status: "todo",
        priority: step.priority,
        assignee_id: null,
        assigned_role: step.assigned_role,
        due_date: dueDate.toISOString().split("T")[0],
        intelligence_id: null,
        workflow_template_id: id,
        source: "workflow",
      };
    });

    const { data: createdTasks, error: insertError } = await supabase
      .from("tasks")
      .insert(tasks)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        data: createdTasks,
        message: `Created ${createdTasks?.length ?? 0} tasks from "${template.name}"`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(`POST /api/workflows/${id}/apply failed:`, err);
    return NextResponse.json(
      { error: "Failed to apply workflow template" },
      { status: 500 }
    );
  }
}
