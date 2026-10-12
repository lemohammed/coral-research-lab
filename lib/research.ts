import { catalogue, classify, type Paper } from "./lab";

export type ProviderStatus = { provider: string; status: "success" | "error"; count: number; message?: string };
export type SearchResult = { papers: Paper[]; providers: ProviderStatus[]; retrievedAt: string; query: string; offset: number; cached: boolean };
const cache = new Map<string, { expires: number; value: SearchResult }>();
const providerCooldown = new Map<string, number>();
function decode(text: string) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/<\/?(?:jats:)?(?:p|pre|em|strong|div|span|br)(?:\s[^>]*)?>/gi, " ").replace(/\s+/g, " ").trim();
}
function tag(text: string, name: string) {
  return decode(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`).exec(text)?.[1] ?? "");
}
function annotation(p: Paper): Paper {
  const known = catalogue.find((c) => c.arxivId === p.arxivId?.replace(/v\d+$/, "") || c.title.toLowerCase() === p.title.toLowerCase());
  return known ? { ...p, name: known.name, layer: known.layer, mechanisms: known.mechanisms, inputs: known.inputs, outputs: known.outputs, evidence: "Source reviewed", codeUrl: known.codeUrl } : p;
}
export function parseAtom(xml: string): Paper[] {
  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const id = tag(e, "id").split("/abs/")[1] ?? "";
    if (!/^\d{4}\.\d{4,5}(?:v\d+)?$/.test(id)) return null;
    const title = tag(e, "title"), summary = tag(e, "summary");
    const date = tag(e, "published");
    return annotation({ id: id.replace(/v\d+$/, ""), arxivId: id.replace(/v\d+$/, ""), title, summary, authors: [...e.matchAll(/<author>([\s\S]*?)<\/author>/g)].map((a) => tag(a[1], "name")), year: Number(date.slice(0, 4)) || 0, publishedAt: date, url: `https://arxiv.org/abs/${id}`, source: "arxiv", ...classify(title, summary), evidence: summary ? "Abstract indexed" : "Metadata only", retrievedAt: new Date().toISOString() } as Paper);
  }).filter((p): p is Paper => p !== null);
}
// Crossref metadata is treated as bibliographic evidence, not independent method validation.
export function parseCrossref(items: any[]): Paper[] {
  return items.filter((i) => i.DOI && Array.isArray(i.title) && i.title[0]).map((i) => {
    const title = decode(i.title[0]), summary = decode(i.abstract ?? "");
    const parts: number[] = (i.published ?? i["published-online"] ?? i.issued)?.["date-parts"]?.[0] ?? [];
    return annotation({ id: `doi:${i.DOI}`, doi: i.DOI, title, summary, authors: (i.author ?? []).map((a: any) => [a.given, a.family].filter(Boolean).join(" ")), year: parts[0] || 0, publishedAt: parts.length >= 3 ? `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}` : "", url: `https://doi.org/${i.DOI}`, source: "crossref", ...classify(title, summary), evidence: summary ? "Abstract indexed" : "Metadata only", retrievedAt: new Date().toISOString() } as Paper);
  });
}
async function boundedFetch(url: string, timeout = 11000) {
  const host = new URL(url).host, until = providerCooldown.get(host) ?? 0;
  if (until > Date.now()) throw new Error(`Provider rate limit: retry in ${Math.ceil((until - Date.now()) / 1000)} seconds.`);
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "CoralResearchLab/1.0 (scholarly research dashboard)", Accept: "application/json, application/atom+xml, text/xml" } });
  if (response.status === 429) {
    const retry = response.headers.get("Retry-After");
    const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : retry ? Math.ceil((Date.parse(retry) - Date.now()) / 1000) : 60;
    const wait = Number.isFinite(seconds) ? Math.max(1, Math.min(seconds, 3600)) : 60;
    providerCooldown.set(host, Date.now() + wait * 1000);
    throw new Error(`Provider rate limit: retry in ${wait} seconds.`);
  }
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  return response;
}
export async function searchPapers(query: string, provider: string, offset: number, year: number, sort: string): Promise<SearchResult> {
  const key = JSON.stringify([query, provider, offset, year, sort]);
  const prior = cache.get(key);
  if (prior && prior.expires > Date.now()) return { ...prior.value, cached: true };
  const clean = query.replace(/[^\p{L}\p{N}\s\-]/gu, " ").trim();
  if (clean.length < 2) throw new Error("Enter at least two letters or numbers.");
  const requested = provider === "all" ? ["arxiv", "crossref"] : [provider];
  const outcomes = await Promise.allSettled(requested.map(async (name) => {
    if (name === "arxiv") {
      const terms = clean.split(/\s+/).slice(0, 12).map((w) => `all:${w}`).join(" AND ");
      const url = new URL("https://export.arxiv.org/api/query");
      url.search = new URLSearchParams({ search_query: `${terms}${year ? ` AND submittedDate:[${year}01010000 TO 209912312359]` : ""}`, start: String(offset), max_results: "12", sortBy: sort === "newest" ? "submittedDate" : "relevance", sortOrder: "descending" }).toString();
      return { name, papers: parseAtom(await (await boundedFetch(url.toString())).text()) };
    }
    const url = new URL("https://api.crossref.org/works");
    url.search = new URLSearchParams({ "query.bibliographic": clean, rows: "12", offset: String(offset), ...(year ? { filter: `from-pub-date:${year}-01-01` } : {}), ...(sort === "newest" ? { sort: "published", order: "desc" } : {}) }).toString();
    const data = await (await boundedFetch(url.toString())).json() as any;
    return { name, papers: parseCrossref(data.message?.items ?? []) };
  }));
  const papers: Paper[] = [], providers: ProviderStatus[] = [];
  outcomes.forEach((r, i) => {
    if (r.status === "fulfilled") { papers.push(...r.value.papers); providers.push({ provider: r.value.name, status: "success", count: r.value.papers.length }); }
    else providers.push({ provider: requested[i], status: "error", count: 0, message: r.reason instanceof Error ? r.reason.message : "Provider unavailable." });
  });
  const deduped = [...new Map(papers.map((p) => [p.title.toLowerCase().replace(/[^a-z0-9]/g, ""), p])).values()];
  const value = { papers: deduped, providers, retrievedAt: new Date().toISOString(), query, offset, cached: false };
  if (providers.some((p) => p.status === "success")) { if (cache.size > 100) cache.clear(); cache.set(key, { value, expires: Date.now() + 5 * 60 * 1000 }); }
  return value;
}
export async function importPaper(identifier: string): Promise<Paper> {
  const arxiv = /(?:arxiv\.org\/(?:abs|pdf)\/|^)(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?(?:[?#].*)?$/.exec(identifier.trim());
  if (arxiv) {
    const response = await boundedFetch(`https://export.arxiv.org/api/query?id_list=${arxiv[1]}`);
    const paper = parseAtom(await response.text())[0];
    if (!paper) throw new Error("That arXiv paper could not be found.");
    return paper;
  }
  const doi = identifier.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (!/^10\.\d{4,9}\/[^\s]+$/i.test(doi) || doi.length > 250) throw new Error("Enter an arXiv ID, arXiv paper URL, DOI, or doi.org URL.");
  const data = await (await boundedFetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)).json() as any;
  const paper = parseCrossref([data.message])[0];
  if (!paper) throw new Error("That DOI has no usable paper metadata.");
  return paper;
}
