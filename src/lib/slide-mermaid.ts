import type { SlideContent } from "@/types/lesson";
import {
  looksLikeMermaidDiagram,
  normalizeMermaidInput,
} from "@/lib/mermaid-sanitize";
import { getEffectiveCodeSnippet } from "@/lib/slide-code-snippet";

export type SlideVisualPlan =
  | { type: "mermaid"; source: string }
  | { type: "flow"; mode: "linear" | "comparison"; labels: string[] }
  | { type: "none" };

/**
 * Same diagram decision path for editor preview and Remotion video.
 * Alias of `getSlideVisualPlan` — one source of truth.
 */
export function buildDiagramPlan(slide: SlideContent): SlideVisualPlan {
  return getSlideVisualPlan(slide);
}

/** Remotion video only supports animated flow (not Mermaid). */
export type RemotionDiagramPlan =
  | { type: "none" }
  | { type: "flow"; mode: "linear" | "comparison"; labels: string[] };

export function visualPlanToRemotionDiagram(plan: SlideVisualPlan): RemotionDiagramPlan {
  if (plan.type === "flow") {
    return { type: "flow", mode: plan.mode, labels: plan.labels };
  }
  return { type: "none" };
}

/**
 * Decide how to visualize the slide: user-authored Mermaid, auto React Flow, or placeholder.
 */
export function getSlideVisualPlan(slide: SlideContent): SlideVisualPlan {
  const rawFromSlide = (slide.visualIdea ?? slide.visualSuggestion)?.trim() ?? "";
  const normalizedDiagram = normalizeMermaidInput(rawFromSlide);

  if (looksLikeMermaidDiagram(normalizedDiagram)) {
    return { type: "mermaid", source: normalizedDiagram };
  }

  const bullets = slide.bullets.filter(Boolean);
  const haystack =
    `${slide.mainIdea} ${bullets.join(" ")} ${rawFromSlide}`.toLowerCase();

  const processy =
    /step|flow|first|then|next|process|loop|recursive|call|chain|order|sequence|pipeline|stages?/i.test(
      haystack
    );
  const comparey = /vs\.?|versus|compared to|\bor\b.*\band\b/i.test(haystack);

  if (bullets.length >= 2 && comparey) {
    return { type: "flow", mode: "comparison", labels: [bullets[0]!, bullets[1]!] };
  }
  if (bullets.length >= 3 && processy) {
    return { type: "flow", mode: "linear", labels: bullets.slice(0, 8) };
  }
  if (bullets.length >= 2 && processy) {
    return { type: "flow", mode: "linear", labels: bullets };
  }
  if (
    bullets.length >= 2 &&
    rawFromSlide.length > 15 &&
    /diagram|chart|map|tree|hierarchy/i.test(rawFromSlide + haystack)
  ) {
    return { type: "flow", mode: "linear", labels: bullets };
  }
  if (bullets.length >= 4) {
    return { type: "flow", mode: "linear", labels: bullets };
  }
  return { type: "none" };
}

/** Only user / explicit Mermaid in visual suggestion (auto diagrams use React Flow). */
export function buildMermaidFromSlide(slide: SlideContent): string | null {
  const p = getSlideVisualPlan(slide);
  return p.type === "mermaid" ? p.source : null;
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
  plan: SlideVisualPlan
): boolean {
  if (isIntroStyleSlide(slide, zeroBasedIndex)) return false;
  if (getEffectiveCodeSnippet(slide)) return true;
  if (plan.type === "flow" || plan.type === "mermaid") return true;
  return false;
}
