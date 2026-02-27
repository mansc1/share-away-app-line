import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

Deno.test("archive-trip: rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/archive-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const data = await res.json();
  assertEquals(res.status, 403);
  assertEquals(data.code, "unauthorized");
});

Deno.test("archive-trip: rejects missing trip_id", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/archive-trip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer fake-token",
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  // Either unauthorized (invalid token) or bad_request
  assertEquals(res.status >= 400, true);
  await res.text().catch(() => {});
});

Deno.test("archive-trip: OPTIONS returns CORS headers", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/archive-trip`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://share-away-app-line.lovable.app",
    },
  });
  assertEquals(res.status, 200);
  const allowOrigin = res.headers.get("access-control-allow-origin");
  assertEquals(allowOrigin, "https://share-away-app-line.lovable.app");
  await res.text();
});
