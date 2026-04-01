import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

Deno.test("set-active-trip rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/set-active-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const data = await res.json();
  assertEquals(res.status, 401);
  assertEquals(data.error, "Unauthorized");
});

Deno.test("set-active-trip rejects missing trip_id for authenticated-looking request", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/set-active-trip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer fake-token",
    },
    body: JSON.stringify({}),
  });

  assertEquals(res.status >= 400, true);
  await res.text().catch(() => {});
});
