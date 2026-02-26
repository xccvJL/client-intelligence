import { NextRequest, NextResponse } from "next/server";
import { generateAccountBrief } from "@/lib/gemini";
import { fetchClientIntelligence } from "@/lib/intelligence";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// POST /api/clients/[id]/generate-brief — auto-generate account brief sections
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const { clientName, systemPrompt } = (await request.json()) as {
      clientName: string;
      systemPrompt?: string;
    };

    if (!clientName) {
      return NextResponse.json(
        { error: "clientName is required" },
        { status: 400 }
      );
    }

    const intelligence = await fetchClientIntelligence(id);
    const brief = await generateAccountBrief(intelligence, clientName, systemPrompt);

    if (!brief) {
      return NextResponse.json(
        { error: "Failed to generate brief — AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: brief });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/clients/[id]/generate-brief failed:", err);
    return NextResponse.json(
      { error: "Failed to generate account brief" },
      { status: 500 }
    );
  }
}
