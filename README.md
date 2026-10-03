# IBKR Flex Trade Ledger

Private Sites dashboard for IBKR Trade Confirmation Flex CSV. It stores individual executions in Sites D1, deduplicated by ClientAccountID and ExecID, and groups fills by trade date. Stock and option are the first filters; unfamiliar asset classes remain stored and visible under All.

## Import

Open the owner-private Site and choose **导入 Flex CSV**. It validates the IBKR header, imports at most 5,000 records per file, and ignores duplicate executions. No trade data belongs in this source repository. Do not commit real CSVs, account IDs, email contents, credentials, or database exports.

The summary reports gross buy/sell proceeds, absolute commissions, and the sum of IBKR NetCash. It does not compute position cost basis or realized P&L. For mixed currencies, the top summary currently displays USD notation and should only be used with USD reports.

## Data source and future automation

Gmail label: `tradeconfirmationflexprocessneeded`. The forwarded IBKR message carries a CSV attachment, sometimes labeled `application/octet-stream`; Gmail's attachment reader may decline that MIME type. An updater can read the raw Gmail MIME message, decode the CSV part, then POST it to `/api/trades` through the Site's owner-private service access with a separate `IMPORT_SECRET` bearer credential. Never place either credential in source, prompt, or browser code. The Site's D1 import is idempotent.

The current deployment exposes a manual CSV import. Automatic Gmail ingestion requires a verified unattended Gmail read and owner-private Site writer connection. Do not schedule until both are independently verified.

The MCP import and status tools require the platform verified email to equal the configured `LEDGER_OWNER_EMAIL`. Configure it as a Site secret. Plugin installation and consent are required before a cloud task may use these tools.

### Daily update procedure after the owner connects the Site plugin

1. Search Gmail with `label:tradeconfirmationflexprocessneeded has:attachment`. Read all unprocessed Flex confirmations since the last successful run, using the report date from the subject or filename as the trade date. Do not mark or delete messages merely to track progress.
2. For each message, use Gmail's attachment reader when supported. If its CSV is reported as `application/octet-stream` with `read_attachment_supported: false`, read the message in `raw` format and decode the MIME attachment's base64 bytes. Only select a `flex.*.csv` attachment from a matching confirmation; do not treat the message body as CSV.
3. Call the connected Site's `import_flex_csv` tool once per CSV. It validates the IBKR header and deduplicates by account and ExecID. A rerun is safe. Keep CSV/account contents out of public repository commits, logs, and task instructions.
4. Call `ledger_status` after imports and confirm the count or latest trade date advanced as expected. On Gmail or Site failure, report it and retry in the next scheduled run; never claim an import succeeded from a search result alone.

Suggested run: weekdays at 14:00 Asia/Hong_Kong, after the usual forwarded confirmation arrives. Search overlapping messages each run so late mail is caught; unique execution IDs prevent duplicates. This task must be created only after a fresh cloud run verifies both Gmail and the Site's owner-authenticated import tool.

## Local

`npm install`, `npm run db:generate`, `npm run build`. Deployment uses the Sites workflow. Database migrations are generated from `db/schema.ts`.
