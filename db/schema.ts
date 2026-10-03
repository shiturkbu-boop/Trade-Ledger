import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";

export const trades = sqliteTable("trades", {
  key: text("key").primaryKey(),
  tradeDate: text("trade_date").notNull(),
  time: text("time").notNull(),
  assetClass: text("asset_class").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description").notNull(),
  side: text("side").notNull(),
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  multiplier: real("multiplier").notNull(),
  strike: real("strike"),
  expiry: text("expiry"),
  putCall: text("put_call"),
  currency: text("currency").notNull(),
  proceeds: real("proceeds").notNull(),
  netCash: real("net_cash").notNull(),
  commission: real("commission").notNull(),
  transactionType: text("transaction_type").notNull(),
  importedAt: integer("imported_at").notNull(),
}, (table) => [index("idx_trades_date_class").on(table.tradeDate, table.assetClass)]);
