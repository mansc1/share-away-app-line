export interface AuthenticatedLineUser {
  id: string;
  line_sub: string;
  display_name: string | null;
  avatar_url?: string | null;
}

export function getAuthIdentityValues(user: AuthenticatedLineUser): string[] {
  return Array.from(new Set([user.id, user.line_sub].filter(Boolean)));
}

interface SupabaseLikeClient {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: unknown }>;
      };
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<unknown>;
    };
  };
}

export async function authenticateLineUser(supabase: SupabaseLikeClient, req: Request): Promise<AuthenticatedLineUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const sessionToken = authHeader.replace("Bearer ", "");
  const { data: session } = await supabase
    .from("line_sessions")
    .select("user_id, expires_at")
    .eq("session_token", sessionToken)
    .single();
  const typedSession = session as { user_id: string; expires_at: string } | null;

  if (!typedSession) return null;
  if (new Date(typedSession.expires_at) < new Date()) {
    await supabase.from("line_sessions").delete().eq("session_token", sessionToken);
    return null;
  }

  const { data: user } = await supabase
    .from("line_users")
    .select("id, line_sub, display_name, avatar_url")
    .eq("id", typedSession.user_id)
    .single();

  return (user as AuthenticatedLineUser | null) ?? null;
}
