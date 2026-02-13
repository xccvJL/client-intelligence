import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// PATCH /api/queue/[id] — manually assign a client to a queue item.
// Used when the AI couldn't auto-match a client, and you pick one manually.
export async function PATCH(
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

    // Update the queue item with the assigned client
    const { error: queueError } = await supabase
      .from("processing_queue")
      .update({ client_id })
      .eq("id", id);

    if (queueError) throw queueError;

    // Also update the related intelligence entry if it exists
    const { data: queueItem } = await supabase
      .from("processing_queue")
      .select("source_id")
      .eq("id", id)
      .single();

    if (queueItem) {
      await supabase
        .from("intelligence")
        .update({ client_id })
        .eq("source_id", queueItem.source_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PATCH /api/queue/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update queue item" },
      { status: 500 }
    );
  }
}
