# Trade Ledger source workflow

The user requires every future source update to be reflected in the public repository:
https://github.com/shiturkbu-boop/Trade-Ledger

For each Site change:

1. Edit and verify the Site checkout, then publish the private Site through its Sites source workflow.
2. Mirror the same source changes to the public GitHub repository's `main` branch, reconciling any remote changes before writing. Verify the final GitHub commit and the Site deployment. Do not describe the task as complete while either required update is outstanding.
3. Before each public push, remove real trade CSVs, account identifiers, email contents, credentials, runtime data, and deployment archives. The public `.openai/hosting.json` must omit `project_id`. Do not publish `.npmrc`, `site-deploy.tar.gz`, or `tsconfig.tsbuildinfo`.
4. Keep the Sites private database and production secrets out of GitHub. GitHub is the version-controlled public source mirror; it does not replace the Site's deployment repository or database.

If a requested change only concerns data in the private database and does not modify source, do not publish private records to GitHub. If one side cannot be updated, report the exact incomplete side.

For Gmail Flex updates, clear the `TradeConfirmationFlexProcessNeeded` label only from a specific message whose CSV executions have all been imported and read back from the private Site. Leave the message and its other labels intact. On partial or uncertain results, retain the pending label for retry.

The user requested unattended synchronization every Tuesday through Saturday at 05:00 Asia/Hong_Kong. Search all pending labeled messages at each run; late arrivals stay queued for the next run. Enable the Site-linked schedule only after the cloud task can read Gmail and invoke the owner-authenticated Site import and verification tools.
