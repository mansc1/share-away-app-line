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
    return json({ code: "method_not_allowed", message: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user = await authenticateUser(supabase, req);
    if (!user) return json({ code: "unauthorized", message: "Not authenticated" }, 403);

    const body = await req.json();
    const { trip_id } = body;

    if (!trip_id) {
      return json({ code: "bad_request", message: "trip_id is required" }, 400);
    }

    // Verify caller is admin
    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return json({ code: "forbidden", message: "Only admins can confirm trips" }, 403);
    }

    // Fetch trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, name, start_date, end_date, capacity_total, status, created_by_user_id, confirmed_at")
      .eq("id", trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ code: "not_found", message: "Trip not found" }, 404);
    }

    if (trip.status !== "open") {
      return json({ code: "invalid_status", message: "Trip is not open" }, 400);
    }

    // Count members
    const { count } = await supabase
      .from("trip_members")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", trip_id);

    if (count !== trip.capacity_total) {
      return json({
        code: "capacity_not_full",
        message: `ต้องมีสมาชิกครบ ${trip.capacity_total} คน (ตอนนี้มี ${count} คน)`,
        count,
        capacity_total: trip.capacity_total,
      }, 400);
    }

    // Confirm trip
    const { data: updated, error: updateErr } = await supabase
      .from("trips")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", trip_id)
      .eq("status", "open")
      .select("id, name, start_date, end_date, capacity_total, status, created_by_user_id, confirmed_at")
      .single();

    if (updateErr || !updated) {
      console.error("confirm-trip update error:", updateErr);
      return json({ code: "internal_error", message: "Failed to confirm trip" }, 500);
    }

    return json({ trip: updated });
  } catch (err) {
    console.error("confirm-trip error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
