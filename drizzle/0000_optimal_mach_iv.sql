CREATE TABLE `trades` (
	`key` text PRIMARY KEY NOT NULL,
	`trade_date` text NOT NULL,
	`time` text NOT NULL,
	`asset_class` text NOT NULL,
	`symbol` text NOT NULL,
	`description` text NOT NULL,
	`side` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`multiplier` real NOT NULL,
	`strike` real,
	`expiry` text,
	`put_call` text,
	`currency` text NOT NULL,
	`proceeds` real NOT NULL,
	`net_cash` real NOT NULL,
	`commission` real NOT NULL,
	`transaction_type` text NOT NULL,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_trades_date_class` ON `trades` (`trade_date`,`asset_class`);