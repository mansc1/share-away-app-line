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

  if (req.method !== "GET") {
    return json({ code: "method_not_allowed", message: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ code: "unauthorized", message: "Not authenticated" }, 403);

    const { data: activeTrip } = await supabase
      .from("user_active_trip")
      .select("trip_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!activeTrip) {
      return json({ trip: null });
    }

    const { data: membership } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", activeTrip.trip_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return json({ trip: null });
    }

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, name, start_date, end_date, capacity_total, status, created_by_user_id, confirmed_at, destination_country_code, default_expense_currency")
      .eq("id", activeTrip.trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ trip: null });
    }

    return json({ trip });
  } catch (err) {
    console.error("get-active-trip error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
