import { searchPapers } from "@/lib/research";
import { json } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const query = (p.get("q") ?? "").trim().slice(0, 160);
  const provider = p.get("provider") ?? "all", sort = p.get("sort") ?? "relevance";
  const offset = Number(p.get("offset") ?? "0"), year = Number(p.get("year") ?? "0");
  if (query.length < 2 || !["all", "arxiv", "crossref"].includes(provider) || !["relevance", "newest"].includes(sort) || !Number.isInteger(offset) || offset < 0 || offset > 1000 || !Number.isInteger(year) || (year !== 0 && (year < 1990 || year > 2100))) return json({ error: "Check the search query and filters." }, 400);
  try { const data = await searchPapers(query, provider, offset, year, sort); return json(data, data.providers.every((s) => s.status === "error") ? 502 : 200); }
  catch (e) { return json({ error: e instanceof Error ? e.message : "Search unavailable." }, 502); }
}
