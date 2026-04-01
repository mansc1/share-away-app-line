import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateSuggestedPayments } from "./payment-calculations.ts";

Deno.test("calculateSuggestedPayments returns minimized settlement graph", () => {
  const result = calculateSuggestedPayments([
    {
      settlement_amount: 1200,
      paid_by: "Alice",
      shared_by: ["Alice", "Bob", "Cara"],
    },
    {
      settlement_amount: 600,
      paid_by: "Bob",
      shared_by: ["Alice", "Bob", "Cara"],
    },
  ]);

  assertEquals(result, [
    {
      fromDisplayName: "Cara",
      toDisplayName: "Alice",
      amount: 600,
    },
  ]);
});

Deno.test("calculateSuggestedPayments ignores empty shared_by rows", () => {
  const result = calculateSuggestedPayments([
    {
      settlement_amount: 500,
      paid_by: "Alice",
      shared_by: [],
    },
  ]);

  assertEquals(result, []);
});
