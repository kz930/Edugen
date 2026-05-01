import type { SlideContent } from "@/types/lesson";

/** Characters that break Mermaid `["…"]` labels — strip or replace */
function cleanLabelText(s: string): string {
  return s
    .replace(/"/g, "'")
    .replace(/\n/g, " ")
    .replace(/#/g, "")
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-wrap for HTML labels (`<br/>`) so boxes are not ultra-narrow in two-column slides */
function wrapForMermaidHtmlLabel(text: string, maxLen: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxLen) {
      cur = next;
      continue;
    }
    if (cur) lines.push(cur);
    if (lines.length >= 6) break;
    cur = w.length > maxLen ? `${w.slice(0, maxLen - 1)}…` : w;
  }
  if (lines.length < 6 && cur) lines.push(cur);
  return lines.join("<br/>");
}

function esc(s: string): string {
  const cleaned = cleanLabelText(s);
  const capped = cleaned.slice(0, 420);
  const w = wrapForMermaidHtmlLabel(capped, 36);
  return w || "…";
}

function linearFlowchart(bullets: string[]): string {
  const b = bullets.slice(0, 8).filter(Boolean);
  if (b.length === 0) return "";
  const lines = ["flowchart TB"];
  b.forEach((_, i) => {
    lines.push(`  n${i}["${esc(b[i]!)}"]`);
  });
  for (let i = 0; i < b.length - 1; i++) {
    lines.push(`  n${i} --> n${i + 1}`);
  }
  return lines.join("\n");
}

/** Two-column comparison inside an LR subgraph so labels are not clipped */
function comparisonFlowchart(left: string, right: string): string {
  const L = esc(left);
  const R = esc(right);
  return [
    "flowchart TB",
    "  subgraph row",
    "    direction LR",
    `    subgraph col1["First idea"]`,
    "      direction TB",
    `      nL["${L}"]`,
    "    end",
    `    subgraph col2["Second idea"]`,
    "      direction TB",
    `      nR["${R}"]`,
    "    end",
    "  end",
  ].join("\n");
}

/**
 * Build Mermaid source from slide content when it looks like a process/flow/comparison,
 * or when `visualSuggestion` already contains Mermaid syntax.
 */
export function buildMermaidFromSlide(slide: SlideContent): string | null {
  const rawVisual = (slide.visualIdea ?? slide.visualSuggestion)?.trim() ?? "";
  if (
    /^(flowchart|graph|sequenceDiagram|mindmap|stateDiagram|erDiagram|classDiagram)/i.test(
      rawVisual
    )
  ) {
    return rawVisual;
  }

  const bullets = slide.bullets.filter(Boolean);
  const haystack = `${slide.mainIdea} ${bullets.join(" ")} ${rawVisual}`.toLowerCase();

  const processy =
    /step|flow|first|then|next|process|loop|recursive|call|chain|order|sequence|pipeline|stages?/i.test(
      haystack
    );
  const comparey = /vs\.?|versus|compared to|\bor\b.*\band\b/i.test(haystack);

  if (bullets.length >= 2 && comparey) {
    return comparisonFlowchart(bullets[0]!, bullets[1]!);
  }
  if (bullets.length >= 3 && processy) {
    return linearFlowchart(bullets);
  }
  if (bullets.length >= 2 && processy) {
    return linearFlowchart(bullets);
  }
  if (
    bullets.length >= 2 &&
    rawVisual.length > 15 &&
    /diagram|chart|map|tree|hierarchy/i.test(rawVisual + haystack)
  ) {
    return linearFlowchart(bullets);
  }
  if (bullets.length >= 4) {
    return linearFlowchart(bullets);
  }
  return null;
}

/** Title / intro: single column layout */
export function isIntroStyleSlide(slide: SlideContent, zeroBasedIndex: number): boolean {
  if (zeroBasedIndex !== 0) return false;
  const bullets = slide.bullets?.length ?? 0;
  if (bullets > 1) return false;
  if (slide.mainIdea.length > 220) return false;
  return true;
}

export function useTwoColumnLayout(
  slide: SlideContent,
  zeroBasedIndex: number,
  mermaidChart: string | null
): boolean {
  if (isIntroStyleSlide(slide, zeroBasedIndex)) return false;
  if (mermaidChart) return true;
  if (slide.bullets.length >= 2) return true;
  if (
    (slide.visualIdea ?? slide.visualSuggestion)?.trim() &&
    slide.bullets.length >= 1
  )
    return true;
  return false;
}
