import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { parseFlexCsv } from "@/lib/flex";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";
const tool = {
  name: "import_flex_csv",
  description: "Import an IBKR Trade Confirmation Flex CSV into the private ledger. Deduplicates executions by account and ExecID. Only use for the owner's authorized Gmail Flex reports.",
  inputSchema: { type: "object", properties: { csv: { type: "string", description: "Complete UTF-8 contents of a Trade Confirmation Flex CSV attachment." } }, required: ["csv"], additionalProperties: false },
};
const headers = { "Cache-Control": "private, no-store", "Content-Type": "application/json" };
const json = (id: unknown, result: unknown) => Response.json({ jsonrpc: "2.0", id, result }, { headers });
const fail = (id: unknown, code: number, message: string, status = 200) => Response.json({ jsonrpc: "2.0", id, error: { code, message } }, { status, headers });

export async function POST(request: Request) {
  let body: { id?: unknown; method?: string; params?: { name?: string; arguments?: { csv?: unknown } } };
  try { body = await request.json(); } catch { return fail(null, -32700, "Invalid JSON", 400); }
  const id = body.id ?? null;
  if (body.method === "initialize") return json(id, { protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "ibkr-flex-ledger", version: "1.0.0" } });
  if (body.method === "notifications/initialized") return new Response(null, { status: 202, headers });
  if (body.method === "tools/list") return json(id, { tools: [tool, {
    name: "ledger_status", description: "Read the latest imported trade date and execution count in the owner's private ledger.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  }, {
    name: "verify_flex_csv", description: "Read back every execution in an IBKR Flex CSV and report whether all are stored. Use before clearing the Gmail pending label.",
    inputSchema: tool.inputSchema,
  }] });
  if (body.method !== "tools/call") return fail(id, -32601, "Unknown method");
  const ownerEmail = (env as unknown as { LEDGER_OWNER_EMAIL?: string }).LEDGER_OWNER_EMAIL;
  const authenticatedEmail = request.headers.get("oai-authenticated-user-email");
  if (!ownerEmail || !authenticatedEmail || authenticatedEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    return fail(id, -32001, "Only the ledger owner may access trade data", 403);
  }
  if (body.params?.name === "ledger_status") {
    try {
      const rows = await getDb().select({ date: trades.tradeDate }).from(trades).orderBy(desc(trades.tradeDate)).limit(10000);
      return json(id, { content: [{ type: "text", text: JSON.stringify({ count: rows.length, latestTradeDate: rows[0]?.date ?? null }) }] });
    } catch { return fail(id, -32000, "Ledger data unavailable", 503); }
  }
  if (body.params?.name === "verify_flex_csv") {
    const csv = body.params.arguments?.csv;
    if (typeof csv !== "string" || csv.length > 2_000_000) return fail(id, -32602, "CSV text is required and must be under 2 MB");
    try {
      const parsed = parseFlexCsv(csv);
      if (parsed.length > 5000) return fail(id, -32602, "At most 5,000 executions per verification");
      const keys = [...new Set(parsed.map(row => row.key))];
      const stored = new Set<string>();
      for (let i = 0; i < keys.length; i += 200) {
        const found = await getDb().select({ key: trades.key }).from(trades).where(inArray(trades.key, keys.slice(i, i + 200)));
        found.forEach(row => stored.add(row.key));
      }
      const missing = keys.filter(key => !stored.has(key)).length;
      return json(id, { content: [{ type: "text", text: JSON.stringify({ totalExecutions: keys.length, storedExecutions: stored.size, missingExecutions: missing, verified: missing === 0 }) }] });
    } catch (error) {
      return json(id, { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Verification failed" }] });
    }
  }
  if (body.params?.name !== tool.name) return fail(id, -32602, "Unknown tool");
  const csv = body.params.arguments?.csv;
  if (typeof csv !== "string" || csv.length > 2_000_000) return fail(id, -32602, "CSV text is required and must be under 2 MB");
  try {
    const parsed = parseFlexCsv(csv);
    if (parsed.length > 5000) return fail(id, -32602, "At most 5,000 executions per import");
    const db = getDb(); let added = 0;
    for (const row of parsed) {
      const inserted = await db.insert(trades).values(row).onConflictDoNothing().returning({ key: trades.key });
      added += inserted.length;
    }
    return json(id, { content: [{ type: "text", text: JSON.stringify({ total: parsed.length, added, duplicates: parsed.length - added }) }] });
  } catch (error) {
    return json(id, { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Import failed" }] });
  }
}

export async function GET() { return new Response(null, { status: 405, headers: { Allow: "POST", ...headers } }); }
