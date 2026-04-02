import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser, getAuthIdentityValues } from "../_shared/auth.ts";
import { normalizeExpenseCurrency } from "../_shared/currency.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface TripMemberNameRow {
  display_name: string;
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

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { trip_id, name, date, time, category, amount, paid_by, shared_by, currency } = body;

    if (!trip_id || !name || !date || !time || !category || amount == null || !paid_by) {
      return json({ error: "Missing required fields" }, 400);
    }

    // Verify trip exists and is not closed
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, status")
      .eq("id", trip_id)
      .single();

    if (tripErr || !trip) return json({ code: "trip_not_found", message: "Trip not found" }, 404);
    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "ทริปนี้ถูกปิดแล้ว" }, 410);
    }

    const identityValues = getAuthIdentityValues(user);

    // Verify current user is a member of the trip
    const { data: currentMember } = await supabase
      .from("trip_members")
      .select("id, role")
      .eq("trip_id", trip_id)
      .in("user_id", identityValues)
      .single();

    if (!currentMember) {
      return json({ code: "not_member", message: "คุณไม่ได้เป็นสมาชิกทริปนี้" }, 403);
    }

    // Validate payer belongs to the trip
    const { data: payerMember } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("display_name", paid_by)
      .single();

    if (!payerMember) {
      return json({ code: "invalid_payer", message: "ผู้จ่ายไม่ได้เป็นสมาชิกทริปนี้" }, 400);
    }

    // Validate all shared members belong to the trip
    const sharedByArray: string[] = shared_by || [];
    if (sharedByArray.length > 0) {
      const { data: tripMembers } = await supabase
        .from("trip_members")
        .select("display_name")
        .eq("trip_id", trip_id);

      const memberNames = new Set((tripMembers || []).map((m: TripMemberNameRow) => m.display_name));
      const invalidMembers = sharedByArray.filter((name: string) => !memberNames.has(name));
      if (invalidMembers.length > 0) {
        return json({ code: "invalid_shared_members", message: `สมาชิกไม่ถูกต้อง: ${invalidMembers.join(", ")}` }, 400);
      }
    }

    const normalizedCurrency = currency == null ? "THB" : normalizeExpenseCurrency(currency);
    if (!normalizedCurrency) {
      return json({ code: "invalid_currency", message: "สกุลเงินไม่รองรับ" }, 400);
    }

    // Insert expense
    const { data: expense, error: insertErr } = await supabase
      .from("expenses")
      .insert({
        trip_id,
        name: name.trim(),
        date,
        time,
        category,
        amount,
        paid_by,
        shared_by: sharedByArray,
        currency: normalizedCurrency,
        thb_amount: null,
        is_converted_to_thb: false,
        user_id: null,
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert expense error:", insertErr);
      return json({
        code: "insert_failed",
        message: insertErr.message || "ไม่สามารถบันทึกรายจ่ายได้",
        details: insertErr.details ?? null,
      }, 500);
    }

    return json(expense, 201);
  } catch (err) {
    console.error("create-expense error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
