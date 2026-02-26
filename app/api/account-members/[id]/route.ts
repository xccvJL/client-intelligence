import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";
import type { AccountRole } from "@/lib/types";

// PATCH /api/account-members/[id] — update role for a member on an account.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data: existing, error: existingError } = await supabase
      .from("account_members")
      .select("id, client_id, role")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Account member not found" },
        { status: 404 }
      );
    }

    await requireClientAccess(teamMember.id, existing.client_id);

    const body = (await request.json()) as { role?: AccountRole };
    const role = body.role;

    if (role !== "owner" && role !== "member") {
      return NextResponse.json(
        { error: "role must be either 'owner' or 'member'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("account_members")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`PATCH /api/account-members/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update account member" },
      { status: 500 }
    );
  }
}

// DELETE /api/account-members/[id] — remove a member from an account.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { teamMember } = await requireAuth(request);

    const { data: existing, error: existingError } = await supabase
      .from("account_members")
      .select("id, client_id")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Account member not found" },
        { status: 404 }
      );
    }

    await requireClientAccess(teamMember.id, existing.client_id);

    const { error } = await supabase
      .from("account_members")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`DELETE /api/account-members/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to remove account member" },
      { status: 500 }
    );
  }
}
