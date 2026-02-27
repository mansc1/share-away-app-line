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

    const { token } = await req.json();

    if (!token) {
      return json({ code: "invalid_invite", error: "Token is required" }, 404);
    }

    // Look up invite
    const { data: invite, error: inviteErr } = await supabase
      .from("trip_invites")
      .select("id, trip_id, status, revoked_reason")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return json({ code: "invalid_invite", error: "Invite not found" }, 404);
    }

    if (invite.status !== "active") {
      if (invite.revoked_reason === "capacity_full") {
        return json({ code: "invite_closed", message: "ทริปเต็มแล้ว" }, 410);
      }
      return json({ code: "invite_revoked", message: "ลิงก์ถูกปิดใช้งานแล้ว" }, 410);
    }

    // Fetch trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, name, start_date, end_date, status, capacity_total")
      .eq("id", invite.trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ code: "invalid_invite", error: "Trip not found" }, 404);
    }

    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "ทริปนี้ปิดแล้ว" }, 410);
    }

    // Count members
    const { count: memberCount } = await supabase
      .from("trip_members")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", trip.id);

    const member_count = memberCount ?? 0;
    const is_full = member_count >= trip.capacity_total;

    // Get admin name
    const { data: admin } = await supabase
      .from("trip_members")
      .select("display_name")
      .eq("trip_id", trip.id)
      .eq("role", "admin")
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return json({
      trip: {
        id: trip.id,
        name: trip.name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: trip.status,
        capacity_total: trip.capacity_total,
      },
      admin_name: admin?.display_name ?? null,
      member_count,
      is_full,
    });
  } catch (err) {
    console.error("get-invite-info error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
