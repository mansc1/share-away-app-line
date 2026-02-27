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

  const { data: user } = await supabase
    .from("line_users")
    .select("id, display_name")
    .eq("id", session.user_id)
    .single();

  return user ?? null;
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
    const { token, display_name } = body;

    if (!token) {
      return json({ error: "Invite token is required" }, 400);
    }

    const memberName = (display_name || user.display_name || "").trim();
    if (!memberName) {
      return json({ error: "display_name is required" }, 400);
    }

    // Look up invite
    const { data: invite, error: inviteErr } = await supabase
      .from("trip_invites")
      .select("id, trip_id, status")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return json({ error: "Invalid invite link" }, 404);
    }

    if (invite.status !== "active") {
      return json({ error: "This invite has been revoked" }, 410);
    }

    // Check trip exists and is open
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, name, status, capacity_total")
      .eq("id", invite.trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ error: "Trip not found" }, 404);
    }

    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", error: "This trip is no longer active" }, 410);
    }

    if (trip.status !== "open" && trip.status !== "confirmed") {
      return json({ error: "This trip is no longer accepting members" }, 409);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Already a member — just set active trip and return success
      await supabase
        .from("user_active_trip")
        .upsert({ user_id: user.id, trip_id: trip.id, updated_at: new Date().toISOString() });
      return json({ trip_id: trip.id, name: trip.name, already_member: true });
    }

    // Check capacity
    const { count } = await supabase
      .from("trip_members")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", trip.id);

    if (count !== null && count >= trip.capacity_total) {
      return json({ code: "trip_full", error: "Trip is full" }, 400);
    }

    // Add member
    const { error: memberErr } = await supabase
      .from("trip_members")
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        display_name: memberName,
        display_name_norm: "", // trigger will populate
        role: "member",
      });

    if (memberErr) {
      console.error("Member insert error:", memberErr);
      if (memberErr.code === "23505") {
        return json({ code: "duplicate_name", error: "A member with a similar name already exists in this trip" }, 409);
      }
      return json({ error: "Failed to join trip" }, 500);
    }

    // Set as active trip
    await supabase
      .from("user_active_trip")
      .upsert({ user_id: user.id, trip_id: trip.id, updated_at: new Date().toISOString() });

    return json({ trip_id: trip.id, name: trip.name, already_member: false }, 201);
  } catch (err) {
    console.error("join-trip error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
