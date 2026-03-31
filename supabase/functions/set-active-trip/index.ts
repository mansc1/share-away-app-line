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
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { trip_id } = await req.json();
    if (!trip_id) return json({ error: "trip_id is required" }, 400);

    const { data: membership, error: membershipErr } = await supabase
      .from("trip_members")
      .select(`
        trips!inner(
          id,
          name,
          start_date,
          end_date,
          capacity_total,
          status,
          created_by_user_id,
          confirmed_at
        )
      `)
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipErr) {
      console.error("set-active-trip membership error:", membershipErr);
      return json({ error: "Failed to verify membership" }, 500);
    }

    if (!membership) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: currentActive, error: currentActiveErr } = await supabase
      .from("user_active_trip")
      .select("trip_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentActiveErr) {
      console.error("set-active-trip active lookup error:", currentActiveErr);
      return json({ error: "Failed to load active trip" }, 500);
    }

    const trip = membership.trips as any;

    if (currentActive?.trip_id === trip_id) {
      return json({
        trip: {
          id: trip.id,
          name: trip.name,
          start_date: trip.start_date,
          end_date: trip.end_date,
          capacity_total: trip.capacity_total,
          status: trip.status,
          created_by_user_id: trip.created_by_user_id,
          confirmed_at: trip.confirmed_at,
        },
      });
    }

    const { error: upsertErr } = await supabase
      .from("user_active_trip")
      .upsert({
        user_id: user.id,
        trip_id,
        updated_at: new Date().toISOString(),
      });

    if (upsertErr) {
      console.error("set-active-trip upsert error:", upsertErr);
      return json({ error: "Failed to set active trip" }, 500);
    }

    return json({
      trip: {
        id: trip.id,
        name: trip.name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        capacity_total: trip.capacity_total,
        status: trip.status,
        created_by_user_id: trip.created_by_user_id,
        confirmed_at: trip.confirmed_at,
      },
    });
  } catch (err) {
    console.error("set-active-trip error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
