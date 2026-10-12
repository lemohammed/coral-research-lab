import { importPaper } from "@/lib/research";
import { json, readBody, sameOrigin } from "@/lib/validation";
export async function POST(request: Request) {
  try { sameOrigin(request); const body = await readBody(request); if (typeof body.identifier !== "string" || body.identifier.length > 1000) return json({ error: "Enter a paper identifier." }, 400); return json({ paper: await importPaper(body.identifier) }); }
  catch (e) { return json({ error: e instanceof Error ? e.message : "Paper import failed." }, 400); }
}
