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

    const body = await req.json();
    const lineSub = (body.line_sub || "").trim();
    const displayName = body.display_name?.trim() || null;
    const avatarUrl = body.avatar_url?.trim() || null;

    if (!lineSub) {
      return json({ error: "line_sub is required" }, 400);
    }

    const { data: existingUser } = await supabase
      .from("line_users")
      .select("id")
      .eq("line_sub", lineSub)
      .maybeSingle();

    let userId = existingUser?.id ?? null;

    if (userId) {
      const { error: updateError } = await supabase
        .from("line_users")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("auth-liff-login update user error:", updateError);
        return json({ error: "Failed to update user" }, 500);
      }
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("line_users")
        .insert({
          line_sub: lineSub,
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .select("id")
        .single();

      if (insertError || !newUser) {
        console.error("auth-liff-login create user error:", insertError);
        return json({ error: "Failed to create user" }, 500);
      }

      userId = newUser.id;
    }

    const tokenArray = new Uint8Array(48);
    crypto.getRandomValues(tokenArray);
    const sessionToken = Array.from(tokenArray, (b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase
      .from("line_sessions")
      .insert({ session_token: sessionToken, user_id: userId, expires_at: expiresAt });

    if (sessionError) {
      console.error("auth-liff-login session create error:", sessionError);
      return json({ error: "Failed to create session" }, 500);
    }

    await supabase
      .from("line_sessions")
      .delete()
      .eq("user_id", userId)
      .lt("expires_at", new Date().toISOString());

    return json({ session_token: sessionToken }, 200);
  } catch (error) {
    console.error("auth-liff-login error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
