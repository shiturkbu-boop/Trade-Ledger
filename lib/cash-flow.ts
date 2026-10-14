import type { Trade } from "./flex";

export const futuresCashNote = "期货 Proceeds 为合约名义金额，不代表实际结算现金流或已实现净盈亏。";
export const proceedsNote = "成交资金流直接读取 CSV Proceeds，未扣手续费；手续费正数为收到，负数为支出。";

// All asset classes use signed raw Proceeds. Preserve NetCash in storage.
export function tradeCashFlow(trade: Trade): number {
  return trade.proceeds;
}

export function totalCashFlow(trades: Trade[]): number {
  return trades.reduce((total, trade) => total + tradeCashFlow(trade), 0);
}
