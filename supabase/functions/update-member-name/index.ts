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
    const { trip_id, display_name } = body;

    if (!trip_id) {
      return json({ code: "bad_request", message: "trip_id is required" }, 400);
    }

    const trimmedName = (display_name || "").trim();
    if (!trimmedName) {
      return json({ code: "bad_request", message: "display_name is required" }, 400);
    }

    // Verify caller is a member
    const { data: membership } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return json({ code: "forbidden", message: "You are not a member of this trip" }, 403);
    }

    // Fetch trip status
    const { data: trip } = await supabase
      .from("trips")
      .select("status")
      .eq("id", trip_id)
      .single();

    if (!trip) {
      return json({ code: "not_found", message: "Trip not found" }, 404);
    }

    if (trip.status !== "open") {
      return json({ code: "trip_locked", message: "รายชื่อถูกยืนยันแล้ว ไม่สามารถเปลี่ยนชื่อได้" }, 400);
    }

    // Update member name
    const { data: member, error: updateErr } = await supabase
      .from("trip_members")
      .update({
        display_name: trimmedName,
        display_name_norm: "", // trigger will populate
      })
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .select("id, user_id, display_name, role, joined_at")
      .single();

    if (updateErr) {
      console.error("update-member-name error:", updateErr);
      if (updateErr.code === "23505") {
        return json({ code: "duplicate_name", message: "ชื่อนี้ถูกใช้แล้วในทริปนี้" }, 409);
      }
      return json({ code: "internal_error", message: "Failed to update name" }, 500);
    }

    return json({ member });
  } catch (err) {
    console.error("update-member-name error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
