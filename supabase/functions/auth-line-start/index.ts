import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LINE_CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID")!;
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL")!;
    const redirectUri = `${APP_BASE_URL}/auth/line/callback`;

    // Generate random state and nonce
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

    const array2 = new Uint8Array(32);
    crypto.getRandomValues(array2);
    const nonce = Array.from(array2, (b) => b.toString(16).padStart(2, "0")).join("");

    // Store state and nonce in DB (expires in 10 min)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("auth_states")
      .insert({ state, nonce, expires_at: expiresAt });

    if (error) {
      console.error("Failed to store auth state:", error);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up expired states (best effort)
    await supabase
      .from("auth_states")
      .delete()
      .lt("expires_at", new Date().toISOString());

    const lineUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    lineUrl.searchParams.set("response_type", "code");
    lineUrl.searchParams.set("client_id", LINE_CHANNEL_ID);
    lineUrl.searchParams.set("redirect_uri", redirectUri);
    lineUrl.searchParams.set("scope", "openid profile");
    lineUrl.searchParams.set("state", state);
    lineUrl.searchParams.set("nonce", nonce);

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: lineUrl.toString() },
    });
  } catch (err) {
    console.error("auth-line-start error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
