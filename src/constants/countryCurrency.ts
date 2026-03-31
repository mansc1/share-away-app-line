export const COUNTRY_CURRENCY_OPTIONS = [
  { countryCode: "TH", countryLabel: "ไทย", currency: "THB" },
  { countryCode: "JP", countryLabel: "ญี่ปุ่น", currency: "JPY" },
  { countryCode: "CN", countryLabel: "จีน", currency: "CNY" },
  { countryCode: "KR", countryLabel: "เกาหลีใต้", currency: "KRW" },
  { countryCode: "US", countryLabel: "สหรัฐอเมริกา", currency: "USD" },
  { countryCode: "SG", countryLabel: "สิงคโปร์", currency: "SGD" },
  { countryCode: "HK", countryLabel: "ฮ่องกง", currency: "HKD" },
  { countryCode: "TW", countryLabel: "ไต้หวัน", currency: "TWD" },
  { countryCode: "VN", countryLabel: "เวียดนาม", currency: "VND" },
  { countryCode: "MY", countryLabel: "มาเลเซีย", currency: "MYR" },
  { countryCode: "LA", countryLabel: "ลาว", currency: "LAK" },
  { countryCode: "KH", countryLabel: "กัมพูชา", currency: "KHR" },
  { countryCode: "FR", countryLabel: "ฝรั่งเศส", currency: "EUR" },
  { countryCode: "DE", countryLabel: "เยอรมนี", currency: "EUR" },
  { countryCode: "IT", countryLabel: "อิตาลี", currency: "EUR" },
] as const;

export type SupportedCountryCode = (typeof COUNTRY_CURRENCY_OPTIONS)[number]["countryCode"];
export type SupportedExpenseCurrency = (typeof COUNTRY_CURRENCY_OPTIONS)[number]["currency"] | "THB";
export const SUPPORTED_EXPENSE_CURRENCIES = Array.from(
  new Set<SupportedExpenseCurrency>(["THB", ...COUNTRY_CURRENCY_OPTIONS.map((option) => option.currency)])
) as SupportedExpenseCurrency[];

export const getDefaultCurrencyForCountry = (countryCode: string | null | undefined) => {
  if (!countryCode) return null;
  return COUNTRY_CURRENCY_OPTIONS.find((option) => option.countryCode === countryCode)?.currency ?? null;
};

export const getCountryLabel = (countryCode: string | null | undefined) => {
  if (!countryCode) return null;
  return COUNTRY_CURRENCY_OPTIONS.find((option) => option.countryCode === countryCode)?.countryLabel ?? null;
};
