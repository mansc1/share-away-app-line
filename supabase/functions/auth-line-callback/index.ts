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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    // Determine app base URL from Referer or fallback
    // The edge function URL is like https://xxx.supabase.co/functions/v1/auth-line-callback
    // We need to redirect to the app, which is on a different domain
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || url.origin.replace(/\.supabase\.co.*/, ".lovable.app");

    if (errorParam) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=${errorParam}` },
      });
    }

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=missing_params` },
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
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=invalid_state` },
      });
    }

    // Delete used state
    await supabase.from("auth_states").delete().eq("id", authState.id);

    const LINE_CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID")!;
    const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${SUPABASE_URL}/functions/v1/auth-line-callback`;

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
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=token_exchange_failed` },
      });
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=no_id_token` },
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
        return new Response(null, {
          status: 302,
          headers: { Location: `${appBaseUrl}/?error=user_create_failed` },
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
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/?error=session_create_failed` },
      });
    }

    // Redirect to app with session token
    return new Response(null, {
      status: 302,
      headers: { Location: `${appBaseUrl}/app?session_token=${sessionToken}` },
    });
  } catch (err) {
    console.error("auth-line-callback error:", err);
    const url = new URL(req.url);
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || url.origin.replace(/\.supabase\.co.*/, ".lovable.app");
    return new Response(null, {
      status: 302,
      headers: { Location: `${appBaseUrl}/?error=internal_error` },
    });
  }
});
