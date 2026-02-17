import { NextRequest, NextResponse } from "next/server";
import { chatWithAccountContext } from "@/lib/gemini";
import type { Intelligence } from "@/lib/types";

// POST /api/clients/[id]/chat — ask a question about an account
// The client sends the intelligence entries along with the question so we
// don't need an extra database round-trip from this endpoint.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // acknowledge the route param

  try {
    const { question, intelligence, systemPrompt } = (await request.json()) as {
      question: string;
      intelligence: Intelligence[];
      systemPrompt?: string;
    };

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const answer = await chatWithAccountContext(intelligence ?? [], question, systemPrompt);

    return NextResponse.json({ data: { answer } });
  } catch (err) {
    console.error("POST /api/clients/[id]/chat failed:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
