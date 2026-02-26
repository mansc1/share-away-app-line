import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const invoke = async (fn: string, method: string, token: string, body?: unknown) => {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": SUPABASE_ANON_KEY,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, opts);
  const data = await res.json();
  return { status: res.status, data };
};

// Helper: create a temporary LINE user + session for testing
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!
);

async function setupTestUser() {
  const lineSub = `test_${crypto.randomUUID()}`;
  const { data: user, error: userErr } = await supabase
    .from("line_users")
    .insert({ line_sub: lineSub, display_name: "Test User" })
    .select()
    .single();
  if (userErr) throw new Error(`Failed to create test user: ${userErr.message}`);

  const sessionToken = crypto.randomUUID();
  const { error: sessErr } = await supabase
    .from("line_sessions")
    .insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    });
  if (sessErr) throw new Error(`Failed to create session: ${sessErr.message}`);

  return { user, sessionToken };
}

async function cleanup(userId: string, tripId?: string) {
  if (tripId) {
    await supabase.from("user_active_trip").delete().eq("user_id", userId);
    await supabase.from("trip_members").delete().eq("trip_id", tripId);
    await supabase.from("trip_invites").delete().eq("trip_id", tripId);
    await supabase.from("trips").delete().eq("id", tripId);
  }
  await supabase.from("line_sessions").delete().eq("user_id", userId);
  await supabase.from("line_users").delete().eq("id", userId);
}

Deno.test("get-active-trip: returns null when no active trip", async () => {
  const { user, sessionToken } = await setupTestUser();
  try {
    const { status, data } = await invoke("get-active-trip", "GET", sessionToken);
    if (status !== 200) throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    if (data.trip !== null) throw new Error(`Expected trip=null, got ${JSON.stringify(data.trip)}`);
    console.log("✅ No active trip → null");
  } finally {
    await cleanup(user.id);
  }
});

Deno.test("get-active-trip: returns trip after create-trip", async () => {
  const { user, sessionToken } = await setupTestUser();
  let tripId: string | undefined;
  try {
    // Create trip
    const createRes = await invoke("create-trip", "POST", sessionToken, {
      name: "Test Trip",
      start_date: "2026-03-01",
      end_date: "2026-03-05",
      capacity_total: 5,
      display_name: "Test User",
    });
    if (createRes.status !== 201) throw new Error(`create-trip failed: ${JSON.stringify(createRes)}`);
    tripId = createRes.data.trip_id;
    console.log("✅ Trip created:", tripId);

    // Get active trip
    const { status, data } = await invoke("get-active-trip", "GET", sessionToken);
    if (status !== 200) throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    if (!data.trip) throw new Error("Expected trip, got null");
    if (data.trip.id !== tripId) throw new Error(`Trip id mismatch: ${data.trip.id} vs ${tripId}`);
    if (data.trip.name !== "Test Trip") throw new Error(`Name mismatch: ${data.trip.name}`);
    console.log("✅ Active trip returned correctly:", data.trip.name);
  } finally {
    await cleanup(user.id, tripId);
  }
});

Deno.test("get-trip-members: returns members after create-trip", async () => {
  const { user, sessionToken } = await setupTestUser();
  let tripId: string | undefined;
  try {
    const createRes = await invoke("create-trip", "POST", sessionToken, {
      name: "Members Test Trip",
      start_date: "2026-04-01",
      end_date: "2026-04-10",
      capacity_total: 3,
      display_name: "Admin User",
    });
    if (createRes.status !== 201) throw new Error(`create-trip failed: ${JSON.stringify(createRes)}`);
    tripId = createRes.data.trip_id;

    const { status, data } = await invoke("get-trip-members", "POST", sessionToken, { trip_id: tripId });
    if (status !== 200) throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    if (!Array.isArray(data.members)) throw new Error("Expected members array");
    if (data.members.length !== 1) throw new Error(`Expected 1 member, got ${data.members.length}`);
    const m = data.members[0];
    if (m.role !== "admin") throw new Error(`Expected admin role, got ${m.role}`);
    if (m.display_name !== "Admin User") throw new Error(`Name mismatch: ${m.display_name}`);
    console.log("✅ Members returned correctly:", data.members);
  } finally {
    await cleanup(user.id, tripId);
  }
});

Deno.test("get-trip-members: 403 for non-member", async () => {
  const { user: user1, sessionToken: token1 } = await setupTestUser();
  const { user: user2, sessionToken: token2 } = await setupTestUser();
  let tripId: string | undefined;
  try {
    const createRes = await invoke("create-trip", "POST", token1, {
      name: "Private Trip",
      start_date: "2026-05-01",
      end_date: "2026-05-05",
      capacity_total: 2,
      display_name: "Owner",
    });
    tripId = createRes.data.trip_id;

    const { status, data } = await invoke("get-trip-members", "POST", token2, { trip_id: tripId });
    if (status !== 403) throw new Error(`Expected 403, got ${status}: ${JSON.stringify(data)}`);
    console.log("✅ Non-member correctly rejected");
  } finally {
    await cleanup(user1.id, tripId);
    await cleanup(user2.id);
  }
});

Deno.test("get-active-trip: 403 without auth", async () => {
  const { status, data } = await invoke("get-active-trip", "GET", "invalid-token");
  if (status !== 403) throw new Error(`Expected 403, got ${status}: ${JSON.stringify(data)}`);
  console.log("✅ Unauthenticated correctly rejected");
});
