
import { SUPPORTED_EXPENSE_CURRENCIES, type SupportedExpenseCurrency } from "./countryCurrency";

export const EXCHANGE_RATE = 4.7; // Fixed rate: 1 CNY = 4.7 THB

export const CURRENCY_SYMBOLS: Record<SupportedExpenseCurrency, string> = {
  CNY: '¥',
  THB: '฿',
  JPY: '¥',
  KRW: '₩',
  USD: '$',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  VND: '₫',
  MYR: 'RM',
  LAK: '₭',
  KHR: '៛',
  EUR: '€',
};

export const CURRENCY_COLORS: Record<SupportedExpenseCurrency, string> = {
  CNY: 'text-red-600',
  THB: 'text-green-600',
  JPY: 'text-indigo-600',
  KRW: 'text-sky-600',
  USD: 'text-emerald-600',
  SGD: 'text-teal-600',
  HKD: 'text-orange-600',
  TWD: 'text-cyan-600',
  VND: 'text-amber-600',
  MYR: 'text-lime-600',
  LAK: 'text-fuchsia-600',
  KHR: 'text-rose-600',
  EUR: 'text-violet-600',
};

export const CURRENCY_BG_COLORS: Record<SupportedExpenseCurrency, string> = {
  CNY: 'bg-red-50 border-red-200',
  THB: 'bg-green-50 border-green-200',
  JPY: 'bg-indigo-50 border-indigo-200',
  KRW: 'bg-sky-50 border-sky-200',
  USD: 'bg-emerald-50 border-emerald-200',
  SGD: 'bg-teal-50 border-teal-200',
  HKD: 'bg-orange-50 border-orange-200',
  TWD: 'bg-cyan-50 border-cyan-200',
  VND: 'bg-amber-50 border-amber-200',
  MYR: 'bg-lime-50 border-lime-200',
  LAK: 'bg-fuchsia-50 border-fuchsia-200',
  KHR: 'bg-rose-50 border-rose-200',
  EUR: 'bg-violet-50 border-violet-200',
};

export type CurrencyType = SupportedExpenseCurrency;

export const formatCurrency = (amount: number, currency: CurrencyType): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString()}`;
};

export const convertCnyToThb = (cnyAmount: number): number => {
  return Math.round(cnyAmount * EXCHANGE_RATE * 100) / 100;
};

export { SUPPORTED_EXPENSE_CURRENCIES };
