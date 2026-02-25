import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Decode base64url
function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Import RSA public key from JWK
async function importKey(jwk: any): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: jwk.alg, ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

// Verify JWT using LINE JWKS
async function verifyIdToken(
  idToken: string,
  expectedNonce: string,
  channelId: string
): Promise<any> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));

  // Fetch LINE JWKS
  const jwksRes = await fetch("https://api.line.me/oauth2/v2.1/certs");
  const jwks = await jwksRes.json();
  const key = jwks.keys.find((k: any) => k.kid === header.kid);
  if (!key) throw new Error("No matching key found in LINE JWKS");

  // Verify signature
  const cryptoKey = await importKey(key);
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64urlDecode(parts[2]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, data);
  if (!valid) throw new Error("Invalid JWT signature");

  // Validate claims
  if (payload.aud !== channelId) throw new Error("Invalid aud");
  if (payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  if (payload.nonce !== expectedNonce) throw new Error("Invalid nonce");

  return payload;
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
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL")!;
    const redirectUri = `${APP_BASE_URL}/auth/line/callback`;

    // Exchange code for tokens
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
      const errBody = await tokenRes.text();
      console.error("Token exchange failed:", errBody);
      return new Response(JSON.stringify({ error: "token_exchange_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      return new Response(JSON.stringify({ error: "no_id_token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify id_token
    const claims = await verifyIdToken(idToken, authState.nonce, LINE_CHANNEL_ID);

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
    console.error("auth-line-callback error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
