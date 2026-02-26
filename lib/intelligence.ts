import { createServerClient } from "@/lib/supabase";
import type { Intelligence } from "@/lib/types";

export async function fetchClientIntelligence(
  clientId: string,
  limit = 200
): Promise<Intelligence[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("intelligence")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Intelligence[];
}

