import { COUNTRY_CURRENCY_MAP } from "./country-currency.ts";

export const SUPPORTED_EXPENSE_CURRENCIES = Array.from(
  new Set(["THB", ...Object.values(COUNTRY_CURRENCY_MAP)])
);

export function normalizeExpenseCurrency(currency: unknown) {
  if (typeof currency !== "string") return null;
  const normalized = currency.trim().toUpperCase();
  if (!normalized) return null;
  return SUPPORTED_EXPENSE_CURRENCIES.includes(normalized) ? normalized : null;
}
