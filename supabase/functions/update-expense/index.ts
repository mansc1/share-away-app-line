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

interface UpdateExpensePayload {
  expense_id?: string;
  trip_id?: string;
  name?: string;
  date?: string;
  time?: string;
  category?: string;
  amount?: number;
  currency?: string;
  thb_amount?: number | null;
  is_converted_to_thb?: boolean;
  paid_by?: string;
  shared_by?: string[];
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

    const body = await req.json() as UpdateExpensePayload;
    const { expense_id, trip_id } = body;

    if (!expense_id || !trip_id) {
      return json({ error: "Missing expense_id or trip_id" }, 400);
    }

    // Fetch expense
    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expense_id)
      .single();

    if (expErr || !expense) return json({ code: "not_found", message: "Expense not found" }, 404);

    // Verify expense belongs to the requested trip
    if (expense.trip_id !== trip_id) {
      return json({ code: "trip_mismatch", message: "Expense does not belong to this trip" }, 400);
    }

    // Verify trip is not closed
    const { data: trip } = await supabase
      .from("trips")
      .select("id, status")
      .eq("id", trip_id)
      .single();

    if (!trip) return json({ code: "trip_not_found", message: "Trip not found" }, 404);
    if (trip.status === "archived" || trip.status === "cancelled") {
      return json({ code: "trip_closed", message: "ทริปนี้ถูกปิดแล้ว" }, 410);
    }

    const identityValues = getAuthIdentityValues(user);

    // Get current user's membership and role
    const { data: currentMember } = await supabase
      .from("trip_members")
      .select("id, role")
      .eq("trip_id", trip_id)
      .in("user_id", identityValues)
      .single();

    if (!currentMember) {
      return json({ code: "not_member", message: "คุณไม่ได้เป็นสมาชิกทริปนี้" }, 403);
    }

    // Permission check
    const isAdmin = currentMember.role === "admin";
    const isCreator = expense.created_by_user_id != null && expense.created_by_user_id === user.id;

    if (!isAdmin && !isCreator) {
      return json({ code: "forbidden", message: "คุณไม่มีสิทธิ์แก้ไขรายจ่ายนี้" }, 403);
    }

    // Build update payload
    const updateData: Record<string, string | number | boolean | null | string[]> = {
      updated_by_user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Optional fields
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) {
      const normalizedCurrency = normalizeExpenseCurrency(body.currency);
      if (!normalizedCurrency) {
        return json({ code: "invalid_currency", message: "สกุลเงินไม่รองรับ" }, 400);
      }
      updateData.currency = normalizedCurrency;
    }
    if (body.thb_amount !== undefined) updateData.thb_amount = body.thb_amount;
    if (body.is_converted_to_thb !== undefined) updateData.is_converted_to_thb = body.is_converted_to_thb;

    // Validate payer if changed
    if (body.paid_by !== undefined) {
      const { data: payerMember } = await supabase
        .from("trip_members")
        .select("id")
        .eq("trip_id", trip_id)
        .eq("display_name", body.paid_by)
        .single();

      if (!payerMember) {
        return json({ code: "invalid_payer", message: "ผู้จ่ายไม่ได้เป็นสมาชิกทริปนี้" }, 400);
      }
      updateData.paid_by = body.paid_by;
    }

    // Validate shared members if changed
    if (body.shared_by !== undefined) {
      const sharedByArray: string[] = body.shared_by || [];
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
      updateData.shared_by = body.shared_by;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", expense_id)
      .select()
      .single();

    if (updateErr) {
      console.error("Update expense error:", updateErr);
      return json({ error: "Failed to update expense" }, 500);
    }

    return json(updated);
  } catch (err) {
    console.error("update-expense error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
