import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Verify id_token using LINE's Verify API (avoids JWKS kid mismatch)
async function verifyIdToken(
  idToken: string,
  expectedNonce: string,
  channelId: string
): Promise<any> {
  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
      nonce: expectedNonce,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`LINE verify API returned ${res.status}: ${errBody}`);
  }

  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate state
    const { data: authState, error: stateError } = await supabase
      .from("auth_states")
      .select("*")
      .eq("state", state)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (stateError || !authState) {
      console.error("Invalid state:", stateError);
      return new Response(JSON.stringify({ error: "invalid_state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete used state
    await supabase.from("auth_states").delete().eq("id", authState.id);

    const LINE_CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID")!;
    const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
    const redirectUri = "https://share-away-app-line.lovable.app/auth/line/callback";

    console.log("Using redirect_uri:", redirectUri);

    // Exchange code for tokens
    let tokenData: any;
    try {
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: LINE_CHANNEL_ID,
          client_secret: LINE_CHANNEL_SECRET,
        }),
      });

      if (!tokenRes.ok) {
        let lineError: any = {};
        try { lineError = await tokenRes.json(); } catch { lineError = { raw: await tokenRes.text() }; }
        console.error("Token exchange failed:", JSON.stringify(lineError));
        return new Response(JSON.stringify({
          error: "token_exchange_failed",
          line_status: tokenRes.status,
          line_error: lineError.error || null,
          line_error_description: lineError.error_description || null,
          redirect_uri_used: redirectUri,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      tokenData = await tokenRes.json();
    } catch (err) {
      console.error("Token exchange network error:", err);
      return new Response(JSON.stringify({ error: "token_exchange_network_error", message: (err as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idToken = tokenData.id_token;
    if (!idToken) {
      return new Response(JSON.stringify({ error: "no_id_token", token_keys: Object.keys(tokenData) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify id_token
    let claims: any;
    try {
      claims = await verifyIdToken(idToken, authState.nonce, LINE_CHANNEL_ID);
    } catch (err) {
      const msg = (err as Error).message;
      console.error("id_token verification failed:", msg);
      // Extract kid from token for debugging
      let kid = "unknown";
      try { kid = JSON.parse(atob(idToken.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))).kid; } catch {}
      return new Response(JSON.stringify({
        error: "id_token_verification_failed",
        message: msg,
        token_kid: kid,
        redirect_uri_used: redirectUri,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lineSub = claims.sub;
    const displayName = claims.name || null;
    const avatarUrl = claims.picture || null;

    // Upsert user
    const { data: existingUser } = await supabase
      .from("line_users")
      .select("id")
      .eq("line_sub", lineSub)
      .single();

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await supabase
        .from("line_users")
        .update({ display_name: displayName, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      const { data: newUser, error: insertErr } = await supabase
        .from("line_users")
        .insert({ line_sub: lineSub, display_name: displayName, avatar_url: avatarUrl })
        .select("id")
        .single();
      if (insertErr || !newUser) {
        console.error("User insert failed:", insertErr);
        return new Response(JSON.stringify({ error: "user_create_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.id;
    }

    // Create session
    const tokenArray = new Uint8Array(48);
    crypto.getRandomValues(tokenArray);
    const sessionToken = Array.from(tokenArray, (b) => b.toString(16).padStart(2, "0")).join("");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: sessionErr } = await supabase
      .from("line_sessions")
      .insert({ session_token: sessionToken, user_id: userId, expires_at: expiresAt });

    if (sessionErr) {
      console.error("Session create failed:", sessionErr);
      return new Response(JSON.stringify({ error: "session_create_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ session_token: sessionToken }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = (err as Error).message || "unknown";
    console.error("auth-line-callback error:", msg, err);
    return new Response(JSON.stringify({ error: "internal_error", message: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
