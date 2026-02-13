import { createServerClient } from "./supabase";
import type { Client } from "./types";

// Try to find a client by matching the email sender's domain.
// For example, if someone emails from "jane@acme.com", this looks
// for a client whose domain is "acme.com".
export async function findClientByDomain(
  emailDomain: string
): Promise<Client | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("domain", emailDomain.toLowerCase())
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Client;
}

// Try to find a client by looking up a specific email address
// in the contacts array. This catches cases where the domain
// doesn't match (e.g., someone using a personal email).
export async function findClientByEmail(
  emailAddress: string
): Promise<Client | null> {
  const supabase = createServerClient();

  // Supabase's `contains` filter can search inside JSONB arrays.
  // We look for any client whose contacts array includes this email.
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .contains("contacts", [{ email: emailAddress.toLowerCase() }])
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Client;
}

// Convenience function: try domain first, then fall back to exact email.
export async function findClientForEmail(
  fromAddress: string
): Promise<Client | null> {
  // Extract domain from "Name <email@domain.com>" or plain "email@domain.com"
  const emailMatch = fromAddress.match(/<(.+?)>/) ?? [null, fromAddress];
  const email = (emailMatch[1] ?? fromAddress).trim().toLowerCase();
  const domain = email.split("@")[1];

  if (domain) {
    const byDomain = await findClientByDomain(domain);
    if (byDomain) return byDomain;
  }

  return findClientByEmail(email);
}
