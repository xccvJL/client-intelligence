import { NextRequest, NextResponse } from "next/server";
import { generateDraftResponse } from "@/lib/gemini";
import { fetchClientIntelligence } from "@/lib/intelligence";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// POST /api/clients/[id]/draft-response — draft an email reply for a specific entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const { entryId, clientName, systemPrompt } = (await request.json()) as {
      entryId: string;
      clientName: string;
      systemPrompt?: string;
    };

    if (!entryId || !clientName) {
      return NextResponse.json(
        { error: "entryId and clientName are required" },
        { status: 400 }
      );
    }

    const intelligence = await fetchClientIntelligence(id);
    const draft = await generateDraftResponse(
      intelligence,
      entryId,
      clientName,
      systemPrompt
    );

    if (!draft) {
      return NextResponse.json(
        { error: "Failed to generate draft — entry not found or AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: draft });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/clients/[id]/draft-response failed:", err);
    return NextResponse.json(
      { error: "Failed to generate draft response" },
      { status: 500 }
    );
  }
}
