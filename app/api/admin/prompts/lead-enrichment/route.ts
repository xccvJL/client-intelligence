import { NextRequest, NextResponse } from "next/server";
import { defaultPromptsMap } from "@/lib/default-prompts";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  buildLeadEnrichmentPrompt,
  getLeadEnrichmentSystemPrompt,
} from "@/lib/gemini";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const defaultPrompt = defaultPromptsMap.lead_enrichment?.defaultPrompt ?? "";
    const envPrompt = process.env.LEAD_ENRICHMENT_SYSTEM_PROMPT?.trim() ?? "";
    const effectivePrompt = getLeadEnrichmentSystemPrompt();

    return NextResponse.json({
      data: {
        key: "lead_enrichment",
        label: "Lead Enrichment",
        source:
          envPrompt.length > 0
            ? "LEAD_ENRICHMENT_SYSTEM_PROMPT"
            : "default_prompts",
        default_system_prompt: defaultPrompt,
        effective_system_prompt: effectivePrompt,
        prompt_template_preview: buildLeadEnrichmentPrompt(
          "{{company_name}}",
          "{{domain}}",
          effectivePrompt
        ),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/admin/prompts/lead-enrichment failed:", err);
    return NextResponse.json(
      { error: "Failed to load lead enrichment prompt details" },
      { status: 500 }
    );
  }
}
