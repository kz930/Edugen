import { NextResponse } from "next/server";
import { enrichAndRank } from "@/lib/rank-sources";
import { hitsToSources, searchTavily } from "@/lib/search-providers";

export const runtime = "nodejs";

/** Dedupe by normalized URL */
function dedupeUrls<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    try {
      const u = new URL(item.url);
      u.hash = "";
      const key = u.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    } catch {
      continue;
    }
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const topic = String(body.topic ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const level = String(body.level ?? "").trim();
    const maxSources = Math.min(Math.max(Number(body.maxSources) || 5, 1), 12);

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const tavily = process.env.TAVILY_API_KEY;
    if (!tavily) {
      return NextResponse.json(
        {
          error:
            "Online resource search requires TAVILY_API_KEY in .env.local.",
        },
        { status: 400 }
      );
    }

    const query = `${topic} ${subject} ${level} explanation tutorial educational site:.edu OR tutorial`;

    let hits: { title: string; url: string; snippet: string }[] = [];

    try {
      hits = await searchTavily(tavily, query, maxSources);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Search failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    let sources = hitsToSources(dedupeUrls(hits));
    sources = dedupeUrls(sources).slice(0, maxSources + 4);

    const ranked = enrichAndRank(
      sources.map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        snippet: s.snippet,
        domain: s.domain,
        publishedAt: s.publishedAt,
        thumbnailUrl: s.thumbnailUrl,
        channelTitle: s.channelTitle,
      })),
      topic
    ).slice(0, maxSources);

    if (ranked.length === 0) {
      return NextResponse.json(
        {
          error:
            "No sources found. Try a different phrasing or check your search API quota.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ sources: ranked });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Invalid request or server error." },
      { status: 500 }
    );
  }
}
