import { NextRequest, NextResponse } from "next/server";
import { generateAccountBrief } from "@/lib/gemini";
import type { Intelligence } from "@/lib/types";

// POST /api/clients/[id]/generate-brief — auto-generate account brief sections
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  try {
    const { intelligence, clientName } = (await request.json()) as {
      intelligence: Intelligence[];
      clientName: string;
    };

    if (!clientName) {
      return NextResponse.json(
        { error: "clientName is required" },
        { status: 400 }
      );
    }

    const brief = await generateAccountBrief(intelligence ?? [], clientName);

    if (!brief) {
      return NextResponse.json(
        { error: "Failed to generate brief — AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: brief });
  } catch (err) {
    console.error("POST /api/clients/[id]/generate-brief failed:", err);
    return NextResponse.json(
      { error: "Failed to generate account brief" },
      { status: 500 }
    );
  }
}
