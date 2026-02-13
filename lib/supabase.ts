import { createClient } from "@supabase/supabase-js";

// Server client — uses the service role key for full access.
// Only use this in API routes and server components, never in the browser.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Check your .env.local file."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Browser client — uses the public anon key with row-level security.
// Safe to use in client components.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check your .env.local file."
    );
  }

  return createClient(url, key);
}
