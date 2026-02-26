import { NextRequest, NextResponse } from "next/server";
import { generateHealthSummary } from "@/lib/gemini";
import type { Intelligence, HealthStatus } from "@/lib/types";

// POST /api/clients/[id]/health-summary — generate an AI health description
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  try {
    const { intelligence, clientName, healthContext } = (await request.json()) as {
      intelligence: Intelligence[];
      clientName: string;
      healthContext: {
        status: HealthStatus;
        satisfaction_score: number;
        renewal_date: string | null;
        last_positive_signal: string | null;
        last_negative_signal: string | null;
        alerts: { severity: string; message: string }[];
      };
    };

    if (!clientName) {
      return NextResponse.json(
        { error: "clientName is required" },
        { status: 400 }
      );
    }

    const summary = await generateHealthSummary(
      intelligence ?? [],
      clientName,
      healthContext
    );

    return NextResponse.json({ data: summary });
  } catch (err) {
    console.error("POST /api/clients/[id]/health-summary failed:", err);
    return NextResponse.json(
      { error: "Failed to generate health summary" },
      { status: 500 }
    );
  }
}
