import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { TeamMember } from "@/lib/types";

export interface AuthContext {
  teamMember: TeamMember;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

function shouldAllowDevHeaderAuth(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_HEADER_AUTH !== "false";
}

async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as TeamMember;
}

async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  const supabase = createServerClient();
  const normalized = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("email", normalized)
    .single();

  if (error || !data) return null;
  return data as TeamMember;
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const devHeaderMemberId = request.headers.get("x-team-member-id");
  if (devHeaderMemberId && shouldAllowDevHeaderAuth()) {
    const teamMember = await getTeamMemberById(devHeaderMemberId);
    if (!teamMember) {
      throw new AuthError("Invalid x-team-member-id header", 401);
    }
    return { teamMember };
  }

  const token = getBearerToken(request);
  if (!token) {
    throw new AuthError("Missing bearer token", 401);
  }

  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    throw new AuthError("Invalid or expired bearer token", 401);
  }

  const teamMember = await getTeamMemberByEmail(user.email);
  if (!teamMember) {
    throw new AuthError("Authenticated user is not provisioned as a team member", 403);
  }

  return { teamMember };
}

export async function getAccessibleClientIds(teamMemberId: string): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("account_members")
    .select("client_id")
    .eq("team_member_id", teamMemberId);

  if (error) throw error;
  return (data ?? []).map((row) => row.client_id as string);
}

export async function canAccessClient(
  teamMemberId: string,
  clientId: string
): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("account_members")
    .select("id")
    .eq("team_member_id", teamMemberId)
    .eq("client_id", clientId)
    .limit(1)
    .single();

  if (error || !data) return false;
  return true;
}

export async function requireClientAccess(
  teamMemberId: string,
  clientId: string
): Promise<void> {
  const allowed = await canAccessClient(teamMemberId, clientId);
  if (!allowed) {
    throw new AuthError("Forbidden: no access to this account", 403);
  }
}

