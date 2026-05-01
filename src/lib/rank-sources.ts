import type { RetrievedSource, SourceType } from "@/types/lesson";
import { domainFromUrl } from "@/lib/utils";

function eduBoost(domain: string): number {
  if (domain.endsWith(".edu")) return 35;
  if (domain.endsWith(".gov")) return 15;
  return 0;
}

const TRUSTED_DOMAINS = [
  "khanacademy.org",
  "openstax.org",
  "mit.edu",
  "stanford.edu",
  "harvard.edu",
  "berkeley.edu",
  "youtube.com",
  "youtu.be",
  "libretexts.org",
  "nih.gov",
  "python.org",
  "developer.mozilla.org",
  "w3.org",
  "readthedocs.io",
  "apache.org",
  "gnu.org",
  "arxiv.org",
  "nature.com",
  "sciencedirect.com",
];

function trustedDomainBoost(domain: string): number {
  let score = 0;
  for (const t of TRUSTED_DOMAINS) {
    if (domain.includes(t)) {
      score += 22;
      break;
    }
  }
  return score;
}

function inferType(url: string, title: string): SourceType {
  const u = url.toLowerCase();
  const ttl = title.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (
    u.includes("developer.mozilla.org") ||
    u.includes("python.org") ||
    u.includes("docs.") ||
    ttl.includes("documentation") ||
    ttl.includes("reference")
  )
    return "documentation";
  try {
    const h = new URL(url).hostname;
    if (h.endsWith(".edu") || h.includes("openstax") || h.includes("libretexts"))
      return "academic";
  } catch {
    /* ignore */
  }
  return "article";
}

/** Rough relevance from snippet overlap with topic keywords */
function topicOverlap(snippet: string, topic: string): number {
  const words = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const s = snippet.toLowerCase();
  let hits = 0;
  for (const w of words) {
    if (s.includes(w)) hits++;
  }
  return Math.min(25, hits * 6);
}

export type RankSourceInput = Omit<
  RetrievedSource,
  "sourceRank" | "includedDefault" | "type"
> & {
  type?: SourceType;
};

export function enrichAndRank(raw: RankSourceInput[], topic: string): RetrievedSource[] {
  const ranked = raw.map((r) => {
    const domain = r.domain || domainFromUrl(r.url);
    const type = inferType(r.url, r.title);
    let score =
      eduBoost(domain) +
      trustedDomainBoost(domain) +
      topicOverlap(r.snippet || "", topic);
    if (type === "documentation") score += 8;
    if (type === "academic") score += 12;
    if (type === "video") score += 5;
    return {
      ...r,
      domain,
      type,
      sourceRank: score,
      includedDefault: true,
    };
  });

  ranked.sort((a, b) => b.sourceRank - a.sourceRank);

  // Prefer diversity: don't drop videos completely if low rank
  return ranked.map((r, i) => ({
    ...r,
    includedDefault: i < Math.min(12, ranked.length),
  }));
}
