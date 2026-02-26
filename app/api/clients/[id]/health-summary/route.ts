import { NextRequest, NextResponse } from "next/server";
import { generateHealthSummary } from "@/lib/gemini";
import type { HealthStatus } from "@/lib/types";
import { fetchClientIntelligence } from "@/lib/intelligence";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// POST /api/clients/[id]/health-summary — generate an AI health description
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const { clientName, healthContext } = (await request.json()) as {
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

    const intelligence = await fetchClientIntelligence(id);
    const summary = await generateHealthSummary(
      intelligence,
      clientName,
      healthContext
    );

    return NextResponse.json({ data: summary });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/clients/[id]/health-summary failed:", err);
    return NextResponse.json(
      { error: "Failed to generate health summary" },
      { status: 500 }
    );
  }
}
