import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

Deno.test("cancel-trip: rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const data = await res.json();
  assertEquals(res.status, 403);
  assertEquals(data.code, "unauthorized");
});

Deno.test("cancel-trip: OPTIONS returns CORS headers", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-trip`, {
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
