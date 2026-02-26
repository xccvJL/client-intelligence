import { NextRequest, NextResponse } from "next/server";
import { chatWithAccountContext } from "@/lib/gemini";
import { fetchClientIntelligence } from "@/lib/intelligence";
import { AuthError, requireAuth, requireClientAccess } from "@/lib/auth";

// POST /api/clients/[id]/chat — ask a question about an account
// The client sends the intelligence entries along with the question so we
// don't need an extra database round-trip from this endpoint.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { teamMember } = await requireAuth(request);
    await requireClientAccess(teamMember.id, id);

    const { question, systemPrompt } = (await request.json()) as {
      question: string;
      systemPrompt?: string;
    };

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const intelligence = await fetchClientIntelligence(id);
    const answer = await chatWithAccountContext(intelligence, question, systemPrompt);

    return NextResponse.json({ data: { answer } });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/clients/[id]/chat failed:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
