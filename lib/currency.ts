import type { Trade } from "./flex";

// A monetary total is only meaningful when all records share CurrencyPrimary.
export function singleCurrency(trades: Pick<Trade, "currency">[], fallback = "USD"): string | null {
  const currencies = new Set(trades.map(trade => trade.currency));
  return currencies.size > 1 ? null : currencies.values().next().value ?? fallback;
}

export function summaryMoney(value: number, currency: string | null, signed = false): string {
  if (!currency) return "分币种查看";
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 2 }).format(value);
  return signed && value > 0 ? `+${amount}` : amount;
}
