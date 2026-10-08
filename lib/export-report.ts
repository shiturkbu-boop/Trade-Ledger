import type { Trade } from "./flex";
import { assetName } from "./assets";

type ExportSummary = { buy: number; sell: number; feeIncome: number; feeExpense: number; fees: number; cash: number };
type ExportOptions = { trades: Trade[]; scope: string; summary: ExportSummary };
const W = 1440;
const PAGE_ROWS = 42;
const fmt = (n: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
const signed = (n: number, currency = "USD") => n > 0 ? `+${fmt(n, currency)}` : fmt(n, currency);
const qty = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function png(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("无法生成图片")), "image/png"));
}

export async function exportReportImages({ trades, scope, summary }: ExportOptions): Promise<number> {
  if (!trades.length) throw new Error("当前筛选结果没有成交记录");
  await document.fonts.ready;
  const pages = Math.ceil(trades.length / PAGE_ROWS);
  for (let page = 0; page < pages; page++) {
    const rows = trades.slice(page * PAGE_ROWS, (page + 1) * PAGE_ROWS);
    const height = 334 + rows.length * 44 + 76;
    const canvas = document.createElement("canvas");
    canvas.width = W * 2; canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持图片导出");
    ctx.scale(2, 2);
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, height);
    ctx.fillStyle = "#b7ef6a"; ctx.fillRect(56, 52, 10, 48);
    ctx.fillStyle = "#ecf2f8"; ctx.font = "700 34px Arial, sans-serif"; ctx.fillText("交易账本", 84, 86);
    ctx.fillStyle = "#9badbd"; ctx.font = "15px Arial, sans-serif";
    ctx.fillText(`IBKR Trade Confirmation Flex  ·  ${scope}  ·  第 ${page + 1}/${pages} 页`, 56, 128);
    if (page === 0) {
      const cards = [
        ["成交笔数", String(trades.length)],
        ["买入成交额", fmt(summary.buy)],
        ["卖出成交额", fmt(summary.sell)],
        ["手续费收入", signed(summary.feeIncome)],
        ["手续费支出", signed(summary.feeExpense)],
        ["净手续费", signed(summary.fees)],
        ["净现金流", fmt(summary.cash)],
      ];
      cards.forEach(([label, value], i) => {
        const x = 56 + (i % 4) * 335, y = 154 + Math.floor(i / 4) * 70;
        ctx.fillStyle = "#152335"; ctx.fillRect(x, y, 320, 60);
        ctx.fillStyle = "#9badbd"; ctx.font = "13px Arial, sans-serif"; ctx.fillText(label, x + 14, y + 21);
        ctx.fillStyle = label === "手续费支出" ? "#ff9eaa" : "#ecf2f8";
        ctx.font = "700 18px Arial, sans-serif"; ctx.fillText(value, x + 14, y + 46);
      });
    }
    const top = 340;
    ctx.fillStyle = "#26394d"; ctx.fillRect(56, top - 30, W - 112, 34);
    const columns: Array<[string, number, CanvasTextAlign]> = [
      ["日期 / 时间", 70, "left"], ["标的 / 类别", 260, "left"], ["方向", 570, "left"],
      ["数量", 700, "right"], ["成交价", 860, "right"], ["成交额", 1010, "right"],
      ["手续费", 1160, "right"], ["净现金流", 1360, "right"],
    ];
    ctx.font = "600 14px Arial, sans-serif"; ctx.fillStyle = "#bbccda";
    columns.forEach(([label, x, align]) => { ctx.textAlign = align; ctx.fillText(label, x, top - 9); });
    rows.forEach((t, i) => {
      const y = top + i * 44;
      ctx.fillStyle = i % 2 ? "#111e2d" : "#152335"; ctx.fillRect(56, y + 5, W - 112, 43);
      const values = [
        `${t.tradeDate} ${t.time}`, `${t.symbol}  ${assetName(t.assetClass)}`,
        t.side === "BUY" ? "买入" : "卖出", qty(t.quantity), t.assetClass === "CASH" ? new Intl.NumberFormat("en-US", { style: "currency", currency: t.currency, maximumFractionDigits: 6 }).format(t.price) : fmt(t.price, t.currency),
        fmt(Math.abs(t.proceeds), t.currency), signed(t.commission, t.currency), fmt(t.netCash, t.currency),
      ];
      ctx.font = "14px Arial, sans-serif";
      values.forEach((value, j) => {
        const [, x, align] = columns[j]; ctx.textAlign = align;
        ctx.fillStyle = j === 6 ? (t.commission < 0 ? "#ff9eaa" : t.commission > 0 ? "#b7ef6a" : "#d7e1e9") : "#ecf2f8";
        ctx.fillText(value, x, y + 32, j === 1 ? 290 : j === 0 ? 180 : 160);
      });
    });
    ctx.textAlign = "left"; ctx.fillStyle = "#8fa2b4"; ctx.font = "13px Arial, sans-serif";
    ctx.fillText("手续费：正数为收到，负数为支出。净现金流不等于已实现盈亏。", 56, height - 32);
    download(await png(canvas), `trade-ledger-${new Date().toISOString().slice(0, 10)}-${String(page + 1).padStart(2, "0")}.png`);
  }
  return pages;
}
