import type { RetrievedSource } from "@/types/lesson";
import { domainFromUrl } from "@/lib/utils";

export interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
}

export async function searchTavily(
  apiKey: string,
  query: string,
  maxResults: number
): Promise<WebSearchHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: Math.min(maxResults, 20),
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  const results = data.results ?? [];
  return results
    .filter((r) => r.url && r.title)
    .map((r) => ({
      title: r.title ?? "",
      url: r.url as string,
      snippet: (r.content ?? "").slice(0, 500),
    }));
}

export function hitsToSources(hits: WebSearchHit[]): Omit<
  RetrievedSource,
  "sourceRank" | "includedDefault" | "type"
>[] {
  return hits.map((h) => ({
    id: crypto.randomUUID(),
    title: h.title,
    url: h.url,
    snippet: h.snippet,
    domain: domainFromUrl(h.url),
  }));
}
