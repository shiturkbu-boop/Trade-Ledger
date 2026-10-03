import { getDb } from "@/db";
import { desc } from "drizzle-orm";
import { trades } from "@/db/schema";
import { parseFlexCsv } from "@/lib/flex";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const rows = await getDb().select().from(trades).orderBy(desc(trades.tradeDate), desc(trades.time)).limit(10000);
    return Response.json({ trades: rows }, { headers });
  } catch {
    return Response.json({ error: "成交数据暂不可用" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const sameOrigin = request.headers.get("origin") === new URL(request.url).origin;
  const importSecret = (env as unknown as { IMPORT_SECRET?: string }).IMPORT_SECRET;
  const serviceAuthorized = !!importSecret && request.headers.get("authorization") === `Bearer ${importSecret}`;
  if (!sameOrigin && !serviceAuthorized) {
    return Response.json({ error: "无效请求来源" }, { status: 403, headers });
  }
  try {
    if (Number(request.headers.get("content-length") || 0) > 2_000_000) throw new Error("文件超过 2 MB");
    const csv = await request.text(); if (csv.length > 2_000_000) throw new Error("文件超过 2 MB");
    const parsed = parseFlexCsv(csv); if (parsed.length > 5000) throw new Error("单次最多 5,000 笔成交");
    const db = getDb(); let added = 0;
    for (const trade of parsed) {
      const result = await db.insert(trades).values(trade).onConflictDoNothing().returning({ key: trades.key });
      added += result.length;
    }
    return Response.json({ total: parsed.length, added, duplicates: parsed.length - added }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "导入失败" }, { status: 400, headers });
  }
}
