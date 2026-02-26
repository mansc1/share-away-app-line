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
    const { name, start_date, end_date, capacity_total, display_name } = body;

    // Validate required fields
    if (!name || !start_date || !end_date || !capacity_total) {
      return json({ error: "Missing required fields: name, start_date, end_date, capacity_total" }, 400);
    }

    if (typeof capacity_total !== "number" || capacity_total < 2) {
      return json({ error: "capacity_total must be >= 2" }, 400);
    }

    if (new Date(end_date) < new Date(start_date)) {
      return json({ error: "end_date must be >= start_date" }, 400);
    }

    const memberName = (display_name || user.display_name || "").trim();
    if (!memberName) {
      return json({ error: "display_name is required" }, 400);
    }

    // Create trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        name: name.trim(),
        start_date,
        end_date,
        capacity_total,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (tripErr) {
      console.error("Trip insert error:", tripErr);
      return json({ error: "Failed to create trip" }, 500);
    }

    // Add creator as admin member
    const { error: memberErr } = await supabase
      .from("trip_members")
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        display_name: memberName,
        display_name_norm: "", // trigger will populate
        role: "admin",
      });

    if (memberErr) {
      console.error("Member insert error:", memberErr);
      // Rollback trip
      await supabase.from("trips").delete().eq("id", trip.id);
      return json({ error: "Failed to add creator as member" }, 500);
    }

    // Set as user's active trip
    await supabase
      .from("user_active_trip")
      .upsert({ user_id: user.id, trip_id: trip.id, updated_at: new Date().toISOString() });

    return json({ trip_id: trip.id, name: trip.name }, 201);
  } catch (err) {
    console.error("create-trip error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
