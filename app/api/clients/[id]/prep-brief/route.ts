import { NextRequest, NextResponse } from "next/server";
import { generatePrepBrief } from "@/lib/gemini";
import type { Intelligence } from "@/lib/types";

// POST /api/clients/[id]/prep-brief — generate a meeting prep brief
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

    const brief = await generatePrepBrief(intelligence ?? [], clientName);

    if (!brief) {
      return NextResponse.json(
        { error: "Failed to generate brief — AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: brief });
  } catch (err) {
    console.error("POST /api/clients/[id]/prep-brief failed:", err);
    return NextResponse.json(
      { error: "Failed to generate prep brief" },
      { status: 500 }
    );
  }
}
