import { z } from "zod";
const layer = z.enum(["peers", "exploration", "mutation", "context", "memory", "tools", "evaluation", "research"]);
const safeUrl = z.string().max(1000).url().refine((s) => s.startsWith("https://"), "Use an HTTPS source URL.");
export const paperSchema = z.object({ id: z.string().min(1).max(300), title: z.string().min(1).max(1000), name: z.string().min(1).max(150), summary: z.string().max(20000), authors: z.array(z.string().max(200)).max(200), year: z.number().int().min(0).max(2100), publishedAt: z.string().max(50), url: safeUrl, source: z.enum(["arxiv", "crossref", "reference"]), arxivId: z.string().max(50).optional(), doi: z.string().max(300).optional(), codeUrl: safeUrl.optional(), layer, mechanisms: z.array(z.string().max(100)).max(15), inputs: z.array(z.string().max(200)).max(30), outputs: z.array(z.string().max(200)).max(30), evidence: z.enum(["Source reviewed", "Abstract indexed", "Metadata only"]), retrievedAt: z.string().max(50), savedAt: z.string().max(50).optional(), mappingSource: z.literal("user").optional() });
export const composeSchema = z.object({ papers: z.array(paperSchema).min(2).max(8), objective: z.string().max(1200), name: z.string().max(100).optional() });
const config = z.object({ name: z.string().min(1).max(100), mission: z.string().min(5).max(5000), peers: z.number().int().min(1).max(64), experimentWorkers: z.number().int().min(1).max(16), dailyBudget: z.number().min(0).max(10000), sourceTarget: z.number().int().min(1).max(10000), priorities: z.array(z.string().max(80)).max(15), modules: z.array(z.enum(["sources", "peers", "blackboard", "tools", "memory", "exploration", "mutation", "grading", "resources", "lineage", "integration"])).max(20).refine((values) => ["sources", "peers", "blackboard", "grading", "resources", "lineage", "integration"].every((id) => values.includes(id as typeof values[number])), "Core evidence and resource modules are required."), sources: z.array(z.object({ id: z.string().max(100), name: z.string().min(1).max(100), kind: z.string().max(80), url: safeUrl, status: z.literal("planned") })).max(500) });
const composition = z.object({ id: z.string().max(100), name: z.string().max(100), createdAt: z.string().max(50), paperIds: z.array(z.string().max(300)).max(8), objective: z.string().max(1200), hypothesis: z.string().max(5000), synergies: z.array(z.string().max(3000)).max(20), conflicts: z.array(z.string().max(3000)).max(20), contracts: z.array(z.object({ from: z.string().max(300), to: z.string().max(300), artifact: z.string().max(300), status: z.enum(["specified", "adapter_needed"]) })).max(100), gaps: z.array(z.string().max(3000)).max(20), experiments: z.array(z.string().max(3000)).max(20), confidence: z.enum(["medium", "low"]), proof: z.literal("not_run") });
export const workspaceSchema = z.object({ papers: z.array(paperSchema).max(500), compositions: z.array(composition).max(100), config, events: z.array(z.object({ id: z.string().max(100), kind: z.string().max(100), title: z.string().max(200), at: z.string().max(50), refs: z.array(z.string().max(300)).max(100), detail: z.string().max(5000) })).max(500) });
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new Error("Cross-origin writes are not accepted.");
}
export async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? "0") > 3_000_000) throw new Error("Request is too large.");
  const text = await request.text();
  if (text.length > 3_000_000) throw new Error("Request is too large.");
  return JSON.parse(text);
}
