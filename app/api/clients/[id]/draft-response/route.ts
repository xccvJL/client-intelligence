import { NextRequest, NextResponse } from "next/server";
import { generateDraftResponse } from "@/lib/gemini";
import type { Intelligence } from "@/lib/types";

// POST /api/clients/[id]/draft-response — draft an email reply for a specific entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  try {
    const { intelligence, entryId, clientName } = (await request.json()) as {
      intelligence: Intelligence[];
      entryId: string;
      clientName: string;
    };

    if (!entryId || !clientName) {
      return NextResponse.json(
        { error: "entryId and clientName are required" },
        { status: 400 }
      );
    }

    const draft = await generateDraftResponse(
      intelligence ?? [],
      entryId,
      clientName
    );

    if (!draft) {
      return NextResponse.json(
        { error: "Failed to generate draft — entry not found or AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: draft });
  } catch (err) {
    console.error("POST /api/clients/[id]/draft-response failed:", err);
    return NextResponse.json(
      { error: "Failed to generate draft response" },
      { status: 500 }
    );
  }
}
