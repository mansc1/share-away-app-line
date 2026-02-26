import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function authenticateUser(supabase: any, req: Request) {
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

  return { id: session.user_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user = await authenticateUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { trip_id } = body;

    if (!trip_id) {
      return json({ error: "trip_id is required" }, 400);
    }

    // Verify user is an admin of this trip
    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return json({ error: "Only trip admins can generate invite links" }, 403);
    }

    // Check trip is open
    const { data: trip } = await supabase
      .from("trips")
      .select("status")
      .eq("id", trip_id)
      .single();

    if (!trip || trip.status !== "open") {
      return json({ error: "Trip is not open for invitations" }, 409);
    }

    // Generate a crypto-random token
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, "0")).join("");

    // Insert invite
    const { error: insertErr } = await supabase
      .from("trip_invites")
      .insert({
        trip_id,
        token,
        created_by_user_id: user.id,
      });

    if (insertErr) {
      console.error("Invite insert error:", insertErr);
      return json({ error: "Failed to create invite" }, 500);
    }

    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://share-away-app-line.lovable.app";
    const invite_url = `${appBaseUrl}/join/${token}`;

    return json({ token, invite_url }, 201);
  } catch (err) {
    console.error("generate-invite-link error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
