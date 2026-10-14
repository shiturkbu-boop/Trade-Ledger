export type Trade = {
  key: string; tradeDate: string; time: string; assetClass: string; symbol: string;
  description: string; side: string; quantity: number; price: number; multiplier: number;
  strike: number | null; expiry: string | null; putCall: string | null; currency: string;
  proceeds: number; netCash: number; commission: number; transactionType: string; importedAt: number;
};

export function parseCsv(source: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  const text = source.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === "," && !quoted) { row.push(value); value = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = "";
    } else value += c;
  }
  if (quoted) throw new Error("CSV 引号未闭合");
  row.push(value); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseFlexCsv(csv: string): Trade[] {
  const rows = parseCsv(csv); if (!rows.length) throw new Error("CSV 文件为空");
  const header = rows.shift()!; const required = ["AssetClass", "Symbol", "TradeDate", "Buy/Sell", "Quantity", "Price", "Proceeds", "NetCash", "Commission", "ExecID"];
  if (required.some((key) => !header.includes(key))) throw new Error("不是受支持的 IBKR Trade Confirmation Flex CSV");
  const now = Date.now();
  return rows.map((cells, index) => {
    const get = (name: string) => cells[header.indexOf(name)] ?? "";
    const num = (name: string) => Number(get(name).replace(/,/g, ""));
    const date = get("TradeDate"); const asset = get("AssetClass");
    if (!/^\d{8}$/.test(date) || !get("Symbol") || !get("ExecID") || !["BUY", "SELL"].includes(get("Buy/Sell")) ||
      ["Quantity", "Price", "Proceeds", "NetCash", "Commission"].some((name) => !Number.isFinite(num(name)))) {
      throw new Error(`第 ${index + 2} 行存在无效成交数据`);
    }
    return {
      key: `${get("ClientAccountID")}:${get("ExecID")}`, tradeDate: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`,
      time: get("Date/Time").split(";")[1]?.replace(/^(\d\d)(\d\d)(\d\d)$/, "$1:$2:$3") || "",
      assetClass: asset, symbol: get("Symbol"), description: get("Description"), side: get("Buy/Sell"),
      quantity: Math.abs(num("Quantity")), price: num("Price"), multiplier: num("Multiplier") || 1,
      strike: get("Strike") ? num("Strike") : null, expiry: get("Expiry") || null, putCall: get("Put/Call") || null,
      currency: get("CurrencyPrimary") || "USD", proceeds: num("Proceeds"), netCash: num("NetCash"),
      commission: num("Commission"), transactionType: get("TransactionType"), importedAt: now,
    };
  });
}
