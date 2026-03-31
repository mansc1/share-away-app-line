import liff from "@line/liff";
import { persistSessionToken } from "@/lib/session";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LIFF_ID = import.meta.env.VITE_LIFF_ID;

let initPromise: Promise<boolean> | null = null;

async function ensureLiffInitialized(): Promise<boolean> {
  if (!LIFF_ID || typeof window === "undefined") return false;

  if (!initPromise) {
    initPromise = liff
      .init({ liffId: LIFF_ID })
      .then(() => true)
      .catch((error) => {
        console.error("LIFF init error:", error);
        return false;
      });
  }

  return initPromise;
}

export async function bootstrapLiffSession(): Promise<string | null> {
  const initialized = await ensureLiffInitialized();
  if (!initialized) return null;

  if (!liff.isLoggedIn()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/auth-liff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_sub: profile.userId,
        display_name: profile.displayName,
        avatar_url: profile.pictureUrl ?? null,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.session_token) {
      console.error("LIFF auth login failed:", data);
      return null;
    }

    persistSessionToken(data.session_token);
    return data.session_token as string;
  } catch (error) {
    console.error("LIFF session bootstrap error:", error);
    return null;
  }
}

export async function isLineEnvironment(): Promise<boolean> {
  const initialized = await ensureLiffInitialized();
  if (!initialized) return false;
  return liff.isInClient();
}
