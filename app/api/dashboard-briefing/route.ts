import { NextRequest, NextResponse } from "next/server";
import { generateDashboardBriefing } from "@/lib/gemini";
import { AuthError, requireAuth } from "@/lib/auth";

// POST /api/dashboard-briefing — generate a prioritized daily briefing
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const { summaryText, systemPrompt } = (await request.json()) as {
      summaryText: string;
      systemPrompt?: string;
    };

    if (!summaryText) {
      return NextResponse.json(
        { error: "summaryText is required" },
        { status: 400 }
      );
    }

    const items = await generateDashboardBriefing(summaryText, systemPrompt);

    return NextResponse.json({ data: items });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/dashboard-briefing failed:", err);
    return NextResponse.json(
      { error: "Failed to generate dashboard briefing" },
      { status: 500 }
    );
  }
}
