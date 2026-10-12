import { env } from "cloudflare:workers";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { initialWorkspace } from "@/lib/lab";
import { json, readBody, sameOrigin, workspaceSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to open your private workspace.", signIn: chatGPTSignInPath("/") }, 401);
  if (!env.DB) return json({ error: "Workspace storage is unavailable." }, 503);
  const row = await env.DB.prepare("SELECT payload, revision, updated_at FROM research_workspaces WHERE owner_id = ?").bind(user.userId).first<{ payload: string; revision: number; updated_at: string }>();
  return json(row ? { workspace: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updated_at } : { workspace: initialWorkspace(), revision: 0, updatedAt: null });
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await getChatGPTUser();
    if (!user) return json({ error: "Sign in to save your private workspace.", signIn: chatGPTSignInPath("/") }, 401);
    if (!env.DB) return json({ error: "Workspace storage is unavailable." }, 503);
    const body = await readBody(request), workspace = workspaceSchema.parse(body.workspace);
    const revision = body.revision;
    if (!Number.isInteger(revision) || revision < 0) return json({ error: "Invalid workspace revision." }, 400);
    const now = new Date().toISOString(), payload = JSON.stringify(workspace);
    const result = revision === 0
      ? await env.DB.prepare("INSERT INTO research_workspaces (owner_id, payload, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(owner_id) DO NOTHING").bind(user.userId, payload, now).run()
      : await env.DB.prepare("UPDATE research_workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?").bind(payload, now, user.userId, revision).run();
    if (!result.meta.changes) return json({ error: "This workspace changed in another tab. Export your current work, then refresh to load the latest revision." }, 409);
    return json({ revision: revision + 1, updatedAt: now });
  } catch (e) { return json({ error: e instanceof Error ? e.message.slice(0, 300) : "Save failed." }, 400); }
}
