import type { Trade } from "./flex";

export const futuresPnlNote = "期货按账户、合约及到期月 FIFO 配对，价差 × CSV 合约乘数 × 已平张数，加分摊的开平仓手续费；归入平仓日。仅基于已导入成交，历史开仓缺失时需补导；未平仓不计浮盈亏。";

type Lot = { trade: Trade; remaining: number };
export type FuturesResult = { gross: number; net: number; closed: number };

// Calculate from ALL imported history before applying date/search filters.
// Keep raw NetCash untouched: realized trading P&L is a separate measure.
export function futuresPnl(trades: Trade[]): Map<string, FuturesResult> {
  const results = new Map<string, FuturesResult>();
  const books = new Map<string, Lot[]>();
  const ordered = trades.filter(t => t.assetClass === "FUT").slice().sort((a, b) =>
    a.tradeDate.localeCompare(b.tradeDate) || a.time.localeCompare(b.time) || a.key.localeCompare(b.key));
  for (const t of ordered) {
    const account = t.key.slice(0, t.key.indexOf(":"));
    const contract = JSON.stringify([account, t.symbol, t.expiry, t.currency, t.multiplier]);
    const lots = books.get(contract) || [];
    const result = { gross: 0, net: 0, closed: 0 };
    let remaining = t.quantity;
    if (!(t.multiplier > 0) || !Number.isFinite(t.multiplier) || !(remaining > 0)) continue;
    while (remaining > 1e-9 && lots.length && lots[0].trade.side !== t.side) {
      const lot = lots[0];
      const quantity = Math.min(remaining, lot.remaining);
      const gross = (t.price - lot.trade.price) * (lot.trade.side === "BUY" ? 1 : -1) * t.multiplier * quantity;
      result.gross += gross;
      result.net += gross + lot.trade.commission * quantity / lot.trade.quantity + t.commission * quantity / t.quantity;
      result.closed += quantity;
      remaining -= quantity;
      lot.remaining -= quantity;
      if (lot.remaining < 1e-9) lots.shift();
    }
    if (remaining > 1e-9) lots.push({ trade: t, remaining });
    books.set(contract, lots);
    results.set(t.key, result);
  }
  return results;
}
