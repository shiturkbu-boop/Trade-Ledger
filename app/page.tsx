"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportReportImages } from "@/lib/export-report";
import type { Trade } from "@/lib/flex";
import { assetClasses, assetName, type AssetClass } from "@/lib/assets";

type View = "ALL" | AssetClass;
const money = (value: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
const signedMoney = (value: number, currency = "USD") => value > 0 ? `+${money(value, currency)}` : money(value, currency);

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [view, setView] = useState<View>("ALL");
  const [date, setDate] = useState("ALL");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const response = await fetch("/api/trades", { cache: "no-store" });
      const data = await response.json() as { trades: Trade[]; error?: string };
      if (!response.ok) throw new Error(data.error || "读取失败");
      setTrades(data.trades); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "读取失败"); }
  }
  useEffect(() => { void refresh(); }, []);
  const dates = useMemo(() => [...new Set(trades.map(x => x.tradeDate))].sort().reverse(), [trades]);
  const filtered = useMemo(() => trades.filter(x =>
    (view === "ALL" || x.assetClass === view) && (date === "ALL" || x.tradeDate === date) &&
    (x.symbol + " " + x.description).toLowerCase().includes(query.trim().toLowerCase())
  ), [trades, view, date, query]);
  const summary = useMemo(() => ({
    count: filtered.length,
    buy: filtered.filter(x => x.side === "BUY").reduce((sum, x) => sum + Math.abs(x.proceeds), 0),
    sell: filtered.filter(x => x.side === "SELL").reduce((sum, x) => sum + Math.abs(x.proceeds), 0),
    feeIncome: filtered.reduce((sum, x) => sum + Math.max(0, x.commission), 0),
    feeExpense: filtered.reduce((sum, x) => sum + Math.min(0, x.commission), 0),
    fees: filtered.reduce((sum, x) => sum + x.commission, 0),
    cash: filtered.reduce((sum, x) => sum + x.netCash, 0),
  }), [filtered]);
  const groups = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const x of filtered) map.set(x.tradeDate, [...(map.get(x.tradeDate) || []), x]);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);
  async function importFile(file?: File) {
    if (!file) return; setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch("/api/trades", { method: "POST", headers: { "Content-Type": "text/csv" }, body: await file.text() });
      const data = await response.json() as { added: number; duplicates: number; error?: string };
      if (!response.ok) throw new Error(data.error || "导入失败");
      setNotice(`已导入 ${data.added} 笔成交，跳过 ${data.duplicates} 笔重复成交`); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "导入失败"); }
    finally { setBusy(false); }
  }
  async function exportImage() {
    setExporting(true); setError(""); setNotice("");
    try {
      const scope = `${date === "ALL" ? "所有日期" : date} · ${view === "ALL" ? "全部类别" : assetName(view)}${query.trim() ? ` · ${query.trim()}` : ""}`;
      const pages = await exportReportImages({ trades: filtered, scope, summary });
      setNotice(`已导出 ${pages} 张 PNG 图片`);
    } catch (e) { setError(e instanceof Error ? e.message : "图片导出失败"); }
    finally { setExporting(false); }
  }
  function exportPdf() {
    if (!filtered.length) { setError("当前筛选结果没有成交记录"); return; }
    setError(""); window.print();
  }

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">⌁</span><div><strong>Trade Ledger</strong><small>IBKR · FLEX CONFIRMATION</small></div></div><span className="private-badge">私人账本</span></header>
    <section className="heading"><div><p className="eyebrow">成交记录 / EXECUTION JOURNAL</p><h1>交易账本</h1><p className="sub">按成交日期查看股票、期权、期货与外汇现货交易。手续费正数为收到，负数为支出；净现金流不等于已实现盈亏。</p><p className="print-scope">筛选范围：{date === "ALL" ? "所有日期" : date} · {view === "ALL" ? "全部类别" : assetName(view)}{query.trim() ? ` · ${query.trim()}` : ""}</p></div>
      <div className="actions"><Button variant="outline" onClick={exportPdf} disabled={!filtered.length} title="在打印对话框中选择另存为 PDF">导出 PDF</Button><Button variant="outline" onClick={() => { void exportImage(); }} disabled={!filtered.length || exporting}>{exporting ? "生成图片中…" : "导出图片"}</Button>
        <label className="upload"><input type="file" accept=".csv,text/csv" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ""; }} disabled={busy} /><Button asChild><span>{busy ? "导入中…" : "导入 Flex CSV"}</span></Button></label></div></section>
    <div className="messages" aria-live="polite">{error && <p className="error">{error}</p>}{notice && <p className="success">{notice}</p>}</div>
    <section className="metrics" aria-label="汇总"><div><span>成交笔数</span><strong>{number(summary.count)}</strong></div><div><span>买入成交额</span><strong>{money(summary.buy)}</strong></div><div><span>卖出成交额</span><strong>{money(summary.sell)}</strong></div><div><span>净手续费</span><strong className={summary.fees < 0 ? "negative" : summary.fees > 0 ? "positive" : ""}>{signedMoney(summary.fees)}</strong><small>收到 {signedMoney(summary.feeIncome)} · 支出 {signedMoney(summary.feeExpense)}</small></div><div><span>净现金流</span><strong className={summary.cash < 0 ? "negative" : "positive"}>{money(summary.cash)}</strong></div></section>
    <section className="ledger"><div className="toolbar"><div className="tabs" role="group" aria-label="资产类别">{([["ALL", "全部"], ...assetClasses] as const).map(([value, label]) =>
      <button key={value} className={view === value ? "active" : ""} onClick={() => setView(value)}>{label}<span>{value === "ALL" ? trades.length : trades.filter(x => x.assetClass === value).length}</span></button>)}</div>
      <div className="filters"><label>交易日<select value={date} onChange={e => setDate(e.target.value)}><option value="ALL">所有日期</option>{dates.map(d => <option key={d} value={d}>{d}</option>)}</select></label><div className="search-control"><Input ref={searchRef} aria-label="搜索标的" placeholder="搜索代码或名称" value={query} onChange={e => setQuery(e.target.value)} />{query && <Button type="button" variant="ghost" size="icon-sm" className="clear-search" aria-label="清除搜索" title="清除搜索" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>×</Button>}</div></div></div>
      {groups.length ? groups.map(([day, rows]) => <div className="day" key={day}><div className="day-heading"><h2>{day}</h2><span>{rows.length} 笔成交 · 净手续费 {signedMoney(rows.reduce((sum, x) => sum + x.commission, 0))}</span></div>
        <div className="table-wrap"><Table><TableHeader><TableRow><TableHead>时间</TableHead><TableHead>类别 / 标的</TableHead><TableHead>方向</TableHead><TableHead className="right">数量</TableHead><TableHead className="right">成交价</TableHead><TableHead className="right">成交额</TableHead><TableHead className="right">手续费</TableHead><TableHead className="right">净现金流</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map(x => <TableRow key={x.key}><TableCell className="mono muted">{x.time || "—"}</TableCell><TableCell><div className="symbol"><b>{x.symbol}</b><span>{assetName(x.assetClass)}</span></div><small className="description">{x.assetClass === "OPT" ? `${x.expiry || ""} ${x.strike || ""} ${x.putCall || ""} · ${x.multiplier}×` : x.assetClass === "FUT" ? `${x.description}${x.expiry ? ` · 到期 ${x.expiry}` : ""} · ${x.multiplier}×` : x.description}</small></TableCell><TableCell><span className={x.side === "BUY" ? "side buy" : "side sell"}>{x.side === "BUY" ? "买入" : "卖出"}</span></TableCell><TableCell className="right mono">{number(x.quantity)}</TableCell><TableCell className="right mono">{x.assetClass === "CASH" ? new Intl.NumberFormat("en-US", { style: "currency", currency: x.currency, maximumFractionDigits: 6 }).format(x.price) : money(x.price, x.currency)}</TableCell><TableCell className="right mono">{money(Math.abs(x.proceeds), x.currency)}</TableCell><TableCell className={`right mono ${x.commission < 0 ? "negative" : x.commission > 0 ? "positive" : "muted"}`}>{signedMoney(x.commission, x.currency)}</TableCell><TableCell className={`right mono ${x.netCash < 0 ? "negative" : "positive"}`}>{money(x.netCash, x.currency)}</TableCell></TableRow>)}</TableBody></Table></div></div>) :
        <div className="empty"><strong>{trades.length ? "没有符合条件的成交" : "尚无成交记录"}</strong><p>{trades.length ? "试试其他日期、资产类别或代码。" : "导入 IBKR Trade Confirmation Flex CSV，成交记录会保存在此站点。"}</p></div>}</section>
    <footer>数据来源：IBKR Trade Confirmation Flex · 按 ExecID 去重 · 不包含持仓或盈亏计算</footer>
  </main>;
}
