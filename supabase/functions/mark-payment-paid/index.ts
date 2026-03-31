import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { payment_id, trip_id } = await req.json();
    if (!payment_id || !trip_id) return json({ error: "payment_id and trip_id are required" }, 400);

    const { data: trip } = await supabase
      .from("trips")
      .select("id, status")
      .eq("id", trip_id)
      .single();

    if (!trip) return json({ code: "trip_not_found", message: "Trip not found" }, 404);
    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "ทริปนี้ถูกปิดแล้ว" }, 410);
    }

    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) return json({ code: "not_member", message: "คุณไม่ได้เป็นสมาชิกทริปนี้" }, 403);

    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .eq("trip_id", trip_id)
      .single();

    if (!payment) return json({ code: "not_found", message: "Payment not found" }, 404);

    const isAdmin = membership.role === "admin";
    if (!isAdmin && payment.from_user_id !== user.id) {
      return json({ code: "forbidden", message: "เฉพาะผู้โอนหรือแอดมินเท่านั้น" }, 403);
    }

    if (payment.status === "confirmed") {
      return json({ payment });
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: payment.paid_at || now,
        updated_by_user_id: user.id,
        updated_at: now,
      })
      .eq("id", payment_id)
      .select("*")
      .single();

    if (error || !updated) {
      console.error("mark-payment-paid error:", error);
      return json({ error: "Failed to update payment" }, 500);
    }

    return json({ payment: updated });
  } catch (error) {
    console.error("mark-payment-paid error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
