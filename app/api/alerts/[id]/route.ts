import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// PATCH /api/alerts/[id] — acknowledge an alert.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data: existingAlert, error: existingAlertError } = await supabase
      .from("health_alerts")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingAlertError || !existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await requireClientAccess(teamMember.id, existingAlert.client_id);

    const body = await request.json();
    const { acknowledged } = body;

    const { data, error } = await supabase
      .from("health_alerts")
      .update({ acknowledged: acknowledged ?? true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`PATCH /api/alerts/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
