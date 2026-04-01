import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser } from "../_shared/auth.ts";
import { calculateSuggestedPayments } from "../_shared/payment-calculations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface TripMemberRow {
  user_id: string;
  display_name: string;
}

interface SettlementExpenseRow {
  name: string;
  amount: number;
  currency: string;
  thb_amount: number | null;
  paid_by: string;
  shared_by: string[] | null;
}

interface PaymentRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  settlement_amount: number | null;
  settlement_currency: string | null;
  status: string;
  created_at: string;
}

interface ResolvedSuggestion {
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settlement_amount: number;
  settlement_currency: string;
}

function paymentKey(fromUserId: string, toUserId: string, amount: number, currency: string) {
  return `${fromUserId}:${toUserId}:${amount.toFixed(2)}:${currency}`;
}

function getStatusRank(status: string) {
  if (status === "confirmed") return 3;
  if (status === "paid") return 2;
  return 1;
}

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

    const { trip_id } = await req.json();
    if (!trip_id) return json({ error: "trip_id is required" }, 400);

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
      .select("id, role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) return json({ code: "not_member", message: "คุณไม่ได้เป็นสมาชิกทริปนี้" }, 403);

    const { data: members } = await supabase
      .from("trip_members")
      .select("user_id, display_name")
      .eq("trip_id", trip_id);

    const memberMap = new Map((members || []).map((member: TripMemberRow) => [member.display_name, member.user_id]));

    const { data: expenses } = await supabase
      .from("expenses")
      .select("name, amount, currency, thb_amount, paid_by, shared_by")
      .eq("trip_id", trip_id);

    const incompleteExpenses = (expenses || []).filter((expense: SettlementExpenseRow) => {
      if (expense.currency === "THB") return false;
      return expense.thb_amount === null || expense.thb_amount === undefined;
    });

    if (incompleteExpenses.length > 0) {
      return json({
        code: "settlement_currency_incomplete",
        message: "ยังมีรายจ่ายบางรายการที่ต้องแปลงเป็นเงินบาทก่อนสร้างยอดโอน",
        incomplete_expense_count: incompleteExpenses.length,
        sample_expense_names: incompleteExpenses.slice(0, 3).map((expense: SettlementExpenseRow) => expense.name),
      }, 409);
    }

    const suggestions = calculateSuggestedPayments(
      (expenses || []).map((expense: SettlementExpenseRow) => ({
        settlement_amount: expense.currency === "THB"
          ? Number(expense.amount)
          : Number(expense.thb_amount),
        paid_by: expense.paid_by,
        shared_by: expense.shared_by || [],
      })),
    );

    const resolvedSuggestions = suggestions
      .map((suggestion) => {
        const fromUserId = memberMap.get(suggestion.fromDisplayName);
        const toUserId = memberMap.get(suggestion.toDisplayName);

        if (!fromUserId || !toUserId) return null;

        return {
          trip_id,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: suggestion.amount,
          settlement_amount: suggestion.amount,
          settlement_currency: "THB",
        };
      })
      .filter(Boolean);

    const { data: existingPayments } = await supabase
      .from("payments")
      .select("*")
      .eq("trip_id", trip_id);

    const normalizedPayments = (existingPayments || []).filter((payment: PaymentRow) => payment.settlement_amount !== null);

    const normalizedByKey = new Map<string, PaymentRow[]>();
    normalizedPayments.forEach((payment: PaymentRow) => {
      const key = paymentKey(
        payment.from_user_id,
        payment.to_user_id,
        Number(payment.settlement_amount),
        payment.settlement_currency || "THB",
      );
      const list = normalizedByKey.get(key) || [];
      list.push(payment);
      normalizedByKey.set(key, list);
    });

    const normalizedRowsToDelete: string[] = [];
    const authoritativeExisting = new Map<string, PaymentRow>();

    normalizedByKey.forEach((paymentsForKey, key) => {
      const sorted = [...paymentsForKey].sort((a, b) => {
        const rankDiff = getStatusRank(b.status) - getStatusRank(a.status);
        if (rankDiff !== 0) return rankDiff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      authoritativeExisting.set(key, sorted[0]);
      sorted.slice(1).forEach((payment) => normalizedRowsToDelete.push(payment.id));
    });

    const suggestionKeys = new Set<string>();
    for (const suggestion of resolvedSuggestions as ResolvedSuggestion[]) {
      suggestionKeys.add(paymentKey(
        suggestion.from_user_id,
        suggestion.to_user_id,
        Number(suggestion.settlement_amount),
        suggestion.settlement_currency,
      ));
    }

    authoritativeExisting.forEach((payment, key) => {
      if (!suggestionKeys.has(key)) {
        normalizedRowsToDelete.push(payment.id);
      }
    });

    if (normalizedRowsToDelete.length > 0) {
      await supabase.from("payments").delete().in("id", normalizedRowsToDelete);
    }

    const paymentsToInsert = (resolvedSuggestions as ResolvedSuggestion[])
      .filter((suggestion) => !authoritativeExisting.has(paymentKey(
        suggestion.from_user_id,
        suggestion.to_user_id,
        Number(suggestion.settlement_amount),
        suggestion.settlement_currency,
      )))
      .map((suggestion) => ({
        ...suggestion,
        status: "pending",
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
      }));

    if (paymentsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("payments").insert(paymentsToInsert);
      if (insertError) {
        console.error("create-payments insert error:", insertError);
        return json({ error: "Failed to create payments" }, 500);
      }
    }

    const { data: syncedPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("trip_id", trip_id)
      .order("created_at", { ascending: true });

    if (paymentsError) {
      console.error("create-payments fetch error:", paymentsError);
      return json({ error: "Failed to fetch payments" }, 500);
    }

    return json({ payments: syncedPayments || [] });
  } catch (error) {
    console.error("create-payments error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
