import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { enrichLead } from "@/lib/gemini";
import type { LeadFormPayload } from "@/lib/types";

// POST /api/webhooks/lead-form — receive a form submission and create a client + deal.
// External form builders (Typeform, JotForm, WordPress, etc.) POST JSON here.
// Requires an x-api-key header that matches the WEBHOOK_API_KEY env variable.
export async function POST(request: NextRequest) {
  // --- 1. Authenticate via API key header ---
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.WEBHOOK_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing API key" },
      { status: 401 }
    );
  }

  // --- 2. Parse and validate the payload ---
  let body: LeadFormPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, email, company, phone, message } = body;

  if (!name || !email || !company) {
    return NextResponse.json(
      { error: "name, email, and company are required fields" },
      { status: 400 }
    );
  }

  // --- 3. Derive the domain from the email (e.g. jane@acme.com → acme.com) ---
  const domain = email.split("@")[1] ?? "";

  const supabase = createServerClient();

  try {
    // --- 4. Create the client (account) in Supabase ---
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: company,
        domain,
        contacts: [{ name, email, role: null }],
        tags: ["lead", "webhook"],
        status: "active",
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // --- 5. Create a deal in the "lead" stage ---
    const noteParts = [
      phone ? `Phone: ${phone}` : null,
      message ? `Message: ${message}` : null,
    ].filter(Boolean);

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        client_id: client.id,
        title: `${company} — Inbound Lead`,
        stage: "lead",
        amount: null,
        close_date: null,
        notes: noteParts.length > 0 ? noteParts.join("\n") : null,
        created_by: null,
      })
      .select()
      .single();

    if (dealError) throw dealError;

    // --- 6. AI enrichment (runs after the response is sent) ---
    // `after()` tells Next.js/Vercel to keep the function alive after responding,
    // so the Gemini call finishes even though we've already sent 201 back.
    after(async () => {
      try {
        const enrichment = await enrichLead(company, domain);
        if (!enrichment) return;

        const enrichmentTags = [
          ...((client.tags as string[]) ?? []),
          enrichment.industry,
        ];
        const enrichmentNotes = [
          `Industry: ${enrichment.industry}`,
          `Company size: ${enrichment.company_size}`,
          `Likely needs: ${enrichment.likely_needs.join(", ")}`,
          `Suggested approach: ${enrichment.suggested_approach}`,
        ].join("\n");

        await supabase
          .from("clients")
          .update({
            tags: enrichmentTags,
            notes: enrichmentNotes,
          })
          .eq("id", client.id);
      } catch (err) {
        console.error("Lead enrichment failed (non-blocking):", err);
      }
    });

    // --- 7. Return the created records ---
    return NextResponse.json(
      {
        data: {
          client_id: client.id,
          deal_id: deal.id,
          client,
          deal,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/webhooks/lead-form failed:", err);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
