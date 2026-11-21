import { sql } from "drizzle-orm";
import type { Trade } from "@/lib/flex";
import { getDb } from "./index";
import { trades } from "./schema";

export async function importTrades(rows: Trade[]) {
  const db = getDb();
  let added = 0;
  let correctedTimes = 0;
  for (const row of rows) {
    const inserted = await db.insert(trades).values(row).onConflictDoNothing().returning({ key: trades.key });
    if (inserted.length) {
      added++;
    } else if (row.executionDate) {
      const corrected = await db.update(trades)
        .set({ executionDate: row.executionDate, time: row.time })
        .where(sql`${trades.key} = ${row.key} AND
          (${trades.executionDate} IS NOT ${row.executionDate} OR ${trades.time} IS NOT ${row.time})`)
        .returning({ key: trades.key });
      correctedTimes += corrected.length;
    }
  }
  return { total: rows.length, added, correctedTimes, duplicates: rows.length - added };
}
