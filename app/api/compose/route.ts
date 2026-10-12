import { compose } from "@/lib/lab";
import { composeSchema, json, readBody, sameOrigin } from "@/lib/validation";
export async function POST(request: Request) {
  try { sameOrigin(request); const body = composeSchema.parse(await readBody(request)); return json({ composition: compose(body.papers, body.objective, body.name) }); }
  catch (e) { return json({ error: e instanceof Error ? e.message.slice(0, 300) : "Composition failed." }, 400); }
}
