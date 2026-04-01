import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

Deno.test("get-trip-payments rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const data = await res.json();
  assertEquals(res.status, 403);
  assertEquals(data.code, "unauthorized");
});

Deno.test("get-trip-payments OPTIONS returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-payments`, {
    method: "OPTIONS",
  });
  await res.text();
  assertEquals(res.status, 200);
});
