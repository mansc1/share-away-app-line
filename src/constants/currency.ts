
export const EXCHANGE_RATE = 4.7; // Fixed rate: 1 CNY = 4.7 THB

export const CURRENCY_SYMBOLS = {
  CNY: '¥',
  THB: '฿'
} as const;

export const CURRENCY_COLORS = {
  CNY: 'text-red-600',
  THB: 'text-green-600'
} as const;

export const CURRENCY_BG_COLORS = {
  CNY: 'bg-red-50 border-red-200',
  THB: 'bg-green-50 border-green-200'
} as const;

export type CurrencyType = keyof typeof CURRENCY_SYMBOLS;

export const formatCurrency = (amount: number, currency: CurrencyType): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString()}`;
};

export const convertCnyToThb = (cnyAmount: number): number => {
  return Math.round(cnyAmount * EXCHANGE_RATE * 100) / 100;
};
