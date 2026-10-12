import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const directory = path.resolve("runs/local-database");
await mkdir(directory, { recursive: true });
const config = path.join(directory, "wrangler.json");
await writeFile(config, JSON.stringify({
  name: "coral-local-workspace",
  compatibility_date: "2026-05-15",
  d1_databases: [{ binding: "DB", database_name: "site-creator-d1", database_id: "00000000-0000-4000-8000-000000000000" }],
}));
const result = spawnSync(process.execPath, [
  "node_modules/wrangler/bin/wrangler.js", "d1", "execute", "site-creator-d1",
  "--local", "--persist-to", ".wrangler/state", "--config", config,
  "--command", "CREATE TABLE IF NOT EXISTS research_workspaces (owner_id text PRIMARY KEY NOT NULL, payload text NOT NULL, revision integer DEFAULT 0 NOT NULL, updated_at text NOT NULL);",
], { stdio: "inherit", env: { ...process.env, TMPDIR: directory, WRANGLER_SEND_METRICS: "false", WRANGLER_WRITE_LOGS: "false" } });
process.exit(result.status ?? 1);
