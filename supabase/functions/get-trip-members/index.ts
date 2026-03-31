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
    const { trip_id } = body;

    if (!trip_id) {
      return json({ code: "bad_request", message: "trip_id is required" }, 400);
    }

    // Verify caller is a member
    const { data: membership } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return json({ code: "forbidden", message: "You are not a member of this trip" }, 403);
    }

    const { data: members, error: membersErr } = await supabase
      .from("trip_members")
      .select("id, user_id, display_name, display_name_norm, role, joined_at")
      .eq("trip_id", trip_id)
      .order("role", { ascending: false })
      .order("joined_at", { ascending: true });

    if (membersErr) {
      console.error("get-trip-members query error:", membersErr);
      return json({ code: "internal_error", message: "Failed to fetch members" }, 500);
    }

    const memberList = members ?? [];

    // Collect user_ids and fetch avatars from line_users
    const userIds = memberList.map((m: any) => m.user_id).filter(Boolean);

    let avatarMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: lineUsers } = await supabase
        .from("line_users")
        .select("id, avatar_url")
        .in("id", userIds);

      if (lineUsers) {
        for (const lu of lineUsers) {
          if (lu.avatar_url) {
            avatarMap[lu.id] = lu.avatar_url;
          }
        }
      }
    }

    // Merge avatar_url into members
    const enriched = memberList.map((m: any) => ({
      ...m,
      avatar_url: avatarMap[m.user_id] || null,
    }));

    return json({ members: enriched });
  } catch (err) {
    console.error("get-trip-members error:", err);
    return json({ code: "internal_error", message: "Internal error" }, 500);
  }
});
