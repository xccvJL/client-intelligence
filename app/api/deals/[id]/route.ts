import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// GET /api/deals/[id] — fetch a single deal.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data, error } = await supabase
      .from("deals")
      .select("*, clients(name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    await requireClientAccess(teamMember.id, data.client_id);

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`GET /api/deals/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

// PATCH /api/deals/[id] — update a deal (stage, amount, etc.).
// When a deal's stage changes, automatically archive or un-archive the
// associated account based on whether all its deals are closed_lost.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data: existingDeal, error: existingDealError } = await supabase
      .from("deals")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingDealError || !existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    await requireClientAccess(teamMember.id, existingDeal.client_id);

    const body = await request.json();
    const { title, stage, amount, close_date, notes } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (stage !== undefined) updates.stage = stage;
    if (amount !== undefined) updates.amount = amount;
    if (close_date !== undefined) updates.close_date = close_date;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Auto-archive / un-archive logic when deal stage changes
    if (stage !== undefined && data) {
      const clientId = data.client_id;

      if (stage === "closed_lost") {
        // Check if ALL deals for this client are now closed_lost
        const { data: otherDeals } = await supabase
          .from("deals")
          .select("id, stage")
          .eq("client_id", clientId);

        const allLost = otherDeals?.every((d) => d.stage === "closed_lost") ?? false;

        if (allLost) {
          await supabase
            .from("clients")
            .update({ status: "archived" })
            .eq("id", clientId);
        }
      } else {
        // Deal moved to a non-closed_lost stage — ensure account is active
        await supabase
          .from("clients")
          .update({ status: "active" })
          .eq("id", clientId);
      }
    }

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`PATCH /api/deals/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] — delete a deal.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data: existingDeal, error: existingDealError } = await supabase
      .from("deals")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingDealError || !existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    await requireClientAccess(teamMember.id, existingDeal.client_id);

    const { error } = await supabase.from("deals").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`DELETE /api/deals/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
