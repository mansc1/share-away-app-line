import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

const call = async (body: Record<string, unknown>) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-invite-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
};

Deno.test("missing token returns 404 invalid_invite", async () => {
  const { status, data } = await call({});
  assertEquals(status, 404);
  assertEquals(data.code, "invalid_invite");
});

Deno.test("random token returns 404 invalid_invite", async () => {
  const { status, data } = await call({ token: "nonexistent_token_abc123" });
  assertEquals(status, 404);
  assertEquals(data.code, "invalid_invite");
});

Deno.test("OPTIONS returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-invite-info`, {
    method: "OPTIONS",
  });
  await res.text();
  assertEquals(res.status, 200);
});
