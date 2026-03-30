import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const { data: user } = await supabase
    .from("line_users")
    .select("id, line_sub, display_name")
    .eq("id", session.user_id)
    .single();

  return user ?? null;
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

    const user = await authenticateUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
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

    // Get current user's membership and role
    const { data: currentMember } = await supabase
      .from("trip_members")
      .select("id, role")
      .eq("trip_id", trip_id)
      .eq("user_id", user.line_sub)
      .single();

    if (!currentMember) {
      return json({ code: "not_member", message: "คุณไม่ได้เป็นสมาชิกทริปนี้" }, 403);
    }

    // Permission check
    const isAdmin = currentMember.role === "admin";
    const isCreator = expense.created_by_user_id != null && expense.created_by_user_id === user.line_sub;

    if (!isAdmin && !isCreator) {
      return json({ code: "forbidden", message: "คุณไม่มีสิทธิ์ลบรายจ่ายนี้" }, 403);
    }

    const { error: deleteErr } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expense_id);

    if (deleteErr) {
      console.error("Delete expense error:", deleteErr);
      return json({ error: "Failed to delete expense" }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("delete-expense error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
