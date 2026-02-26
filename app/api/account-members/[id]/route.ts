import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// DELETE /api/account-members/[id] — remove a member from an account.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from("account_members")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/account-members/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to remove account member" },
      { status: 500 }
    );
  }
}
