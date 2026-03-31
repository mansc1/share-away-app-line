export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  TH: "THB",
  JP: "JPY",
  CN: "CNY",
  KR: "KRW",
  US: "USD",
  SG: "SGD",
  HK: "HKD",
  TW: "TWD",
  VN: "VND",
  MY: "MYR",
  LA: "LAK",
  KH: "KHR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
};

export function getDefaultCurrencyForCountry(countryCode: string | null | undefined) {
  if (!countryCode) return null;
  return COUNTRY_CURRENCY_MAP[countryCode] ?? null;
}
