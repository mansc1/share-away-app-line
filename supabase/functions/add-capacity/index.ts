import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser } from "../_shared/auth.ts";

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

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ code: "unauthorized", message: "Not authenticated" }, 403);

    const body = await req.json();
    const { trip_id, add_count } = body;

    if (!trip_id) return json({ code: "bad_request", message: "trip_id is required" }, 400);

    const count = Number(add_count);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return json({ code: "bad_request", message: "add_count must be an integer between 1 and 50" }, 400);
    }

    // Verify admin
    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return json({ code: "forbidden", message: "Only admins can add capacity" }, 403);
    }

    // Fetch current trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, status, capacity_total")
      .eq("id", trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ code: "not_found", message: "Trip not found" }, 404);
    }

    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "Trip is no longer active" }, 410);
    }

    const newCapacity = trip.capacity_total + count;

    const { data: updated, error: updateErr } = await supabase
      .from("trips")
      .update({ capacity_total: newCapacity })
      .eq("id", trip_id)
      .select("id, name, start_date, end_date, capacity_total, status, created_by_user_id, confirmed_at")
      .single();

    if (updateErr || !updated) {
      console.error("add-capacity update error:", updateErr);
      return json({ code: "internal_error", message: "Failed to update capacity" }, 500);
    }

    return json({ trip: updated });
  } catch (err) {
    console.error("add-capacity error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
