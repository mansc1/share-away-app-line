import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://share-away-app-line.lovable.app",
  "https://id-preview--fe312698-1563-42ac-b656-18c53beb2c59.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const json = (body: unknown, status = 200, req?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? getCorsHeaders(req) : { "Access-Control-Allow-Origin": "*" }), "Content-Type": "application/json" },
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
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json({ code: "method_not_allowed", message: "Method not allowed" }, 405, req);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user = await authenticateUser(supabase, req);
    if (!user) return json({ code: "unauthorized", message: "Not authenticated" }, 403, req);

    const body = await req.json();
    const { trip_id } = body;

    if (!trip_id) return json({ code: "bad_request", message: "trip_id is required" }, 400, req);

    // Verify admin
    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return json({ code: "forbidden", message: "Only admins can archive trips" }, 403, req);
    }

    // Fetch trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, status")
      .eq("id", trip_id)
      .single();

    if (tripErr || !trip) {
      return json({ code: "not_found", message: "Trip not found" }, 404, req);
    }

    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "Trip is already archived or cancelled" }, 410, req);
    }

    // Archive
    const { data: updated, error: updateErr } = await supabase
      .from("trips")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", trip_id)
      .select("id, name, status, archived_at")
      .single();

    if (updateErr || !updated) {
      console.error("archive-trip update error:", updateErr);
      return json({ code: "internal_error", message: "Failed to archive trip" }, 500, req);
    }

    // Clear user_active_trip for all members of this trip
    await supabase.from("user_active_trip").delete().eq("trip_id", trip_id);

    return json({ trip: updated }, 200, req);
  } catch (err) {
    console.error("archive-trip error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500, req);
  }
});
