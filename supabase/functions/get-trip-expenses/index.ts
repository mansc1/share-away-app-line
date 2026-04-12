import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser, getAuthIdentityValues } from "../_shared/auth.ts";

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ code: "unauthorized", message: "Not authenticated" }, 403);

    const { trip_id } = await req.json();
    if (!trip_id) {
      return json({ code: "bad_request", message: "trip_id is required" }, 400);
    }

    const identityValues = getAuthIdentityValues(user);

    const { data: membership, error: membershipErr } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .in("user_id", identityValues)
      .limit(1)
      .maybeSingle();

    if (membershipErr) {
      console.error("get-trip-expenses membership error:", membershipErr);
      return json({ code: "membership_lookup_failed", message: "Failed to verify membership" }, 500);
    }

    if (!membership) {
      return json({ code: "forbidden", message: "You are not a member of this trip" }, 403);
    }

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", trip_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("get-trip-expenses query error:", error);
      return json({ code: "internal_error", message: "Failed to fetch expenses" }, 500);
    }

    return json({ expenses: expenses ?? [] });
  } catch (err) {
    console.error("get-trip-expenses error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
