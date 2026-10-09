import type { Trade } from "./flex";

export const futuresCashNote = "期货现金流需逐日结算数据；成交确认中的 NetCash 不能代表完整现金流。手续费单独列示。";

// Retain the raw Flex NetCash in storage. Futures settlement cash is reported
// separately in Cash Report (Cash Settling MTM), not in these executions.
export function tradeCashFlow(trade: Trade): number | null {
  return trade.assetClass === "FUT" ? null : trade.netCash;
}

export function totalCashFlow(trades: Trade[]): number | null {
  let total = 0;
  for (const trade of trades) {
    const cash = tradeCashFlow(trade);
    if (cash === null) return null;
    total += cash;
  }
  return total;
}
