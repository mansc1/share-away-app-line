import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateSuggestedPayments } from "../_shared/payment-calculations.ts";

Deno.test("create-payments settlement logic produces THB-ready payments", () => {
  const result = calculateSuggestedPayments([
    {
      settlement_amount: 900,
      paid_by: "แมน",
      shared_by: ["แมน", "ยุ้ย", "แอน"],
    },
    {
      settlement_amount: 300,
      paid_by: "ยุ้ย",
      shared_by: ["แมน", "ยุ้ย", "แอน"],
    },
  ]);

  assertEquals(result, [
    {
      fromDisplayName: "แอน",
      toDisplayName: "แมน",
      amount: 300,
    },
  ]);
});
