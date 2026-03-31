export interface AuthenticatedLineUser {
  id: string;
  line_sub: string;
  display_name: string | null;
  avatar_url?: string | null;
}

export async function authenticateLineUser(supabase: any, req: Request): Promise<AuthenticatedLineUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const sessionToken = authHeader.replace("Bearer ", "");
  const { data: session } = await supabase
    .from("line_sessions")
    .select("user_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("line_sessions").delete().eq("session_token", sessionToken);
    return null;
  }

  const { data: user } = await supabase
    .from("line_users")
    .select("id, line_sub, display_name, avatar_url")
    .eq("id", session.user_id)
    .single();

  return user ?? null;
}
