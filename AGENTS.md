# Trade Ledger source workflow

The user requires every future source update to be reflected in the public repository:
https://github.com/shiturkbu-boop/Trade-Ledger

For each Site change:

1. Edit and verify the Site checkout, then publish the private Site through its Sites source workflow.
2. Mirror the same source changes to the public GitHub repository's `main` branch, reconciling any remote changes before writing. Verify the final GitHub commit and the Site deployment. Do not describe the task as complete while either required update is outstanding.
3. Before each public push, remove real trade CSVs, account identifiers, email contents, credentials, runtime data, and deployment archives. The public `.openai/hosting.json` must omit `project_id`. Do not publish `.npmrc`, `site-deploy.tar.gz`, or `tsconfig.tsbuildinfo`.
4. Keep the Sites private database and production secrets out of GitHub. GitHub is the version-controlled public source mirror; it does not replace the Site's deployment repository or database.

If a requested change only concerns data in the private database and does not modify source, do not publish private records to GitHub. If one side cannot be updated, report the exact incomplete side.
