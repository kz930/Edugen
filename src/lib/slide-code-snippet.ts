/**
 * Detect real code vs prose descriptions masquerading as code (AI placeholders).
 */

import type { SlideContent } from "@/types/lesson";
import { sanitizeSlideVisual } from "@/lib/sanitize-slide-visual";

/** Plain English one-liner often returned instead of fenced code */
export function isLikelyProseDescription(str: string): boolean {
  const s = str.trim();
  return /^[A-Z][^{}\n]*\.$/.test(s);
}

/**
 * True if the string looks like actual source code (not a sentence description).
 */
export function looksLikeCode(str: string): boolean {
  const s = str.trim();
  if (s.length < 2) return false;
  if (isLikelyProseDescription(s)) return false;
  const markers =
    /\bdef\b|\bfunction\b|\bclass\b|\bif\b|\breturn\b|\bfor\b|\bwhile\b|=>|\{|\}|;|\/\/|#|\n/;
  return markers.test(s);
}

/** Raw inner text of first ``` fenced block in blob (no validation). */
export function extractRawFenceInner(blob: string): string | null {
  const m = blob.match(/```(?:[^\n]*)\n([\s\S]*?)```/);
  return m?.[1] ? m[1].trim() : null;
}

/**
 * Prefer explicit `codeSnippet`, else first fenced block in `visualSuggestion`.
 * Returns null unless content passes `looksLikeCode`.
 */
export function getEffectiveCodeSnippet(slide: SlideContent): string | null {
  const explicit = slide.codeSnippet?.trim();
  if (explicit) {
    if (looksLikeCode(explicit)) return explicit;
    return null;
  }
  const inner = extractRawFenceInner(slide.visualSuggestion ?? "");
  if (inner && looksLikeCode(inner)) return inner.slice(0, 8000);
  return null;
}

/** True if model tried to supply code but only supplied prose / invalid snippet. */
export function hasCodePlaceholder(slide: SlideContent): boolean {
  const explicit = slide.codeSnippet?.trim();
  if (explicit && !looksLikeCode(explicit)) return true;
  const inner = extractRawFenceInner(slide.visualSuggestion ?? "");
  if (inner && inner.length > 0 && !looksLikeCode(inner)) return true;
  return false;
}

/** Language tag after opening fence, if any (e.g. ```python). */
export function inferCodeLanguage(slide: SlideContent): string {
  const blob = `${slide.visualSuggestion ?? ""}\n${slide.codeSnippet ?? ""}`;
  const m = blob.match(/```(\w+)/);
  if (m?.[1]) return m[1];
  return "python";
}

/**
 * Strip invalid codeSnippet; remove invalid fenced blocks from visualSuggestion; log warnings.
 */
export function sanitizeSlideContent(slide: SlideContent, context?: string): SlideContent {
  const ctx = context ?? "slide";
  let visualSuggestion = slide.visualSuggestion ?? "";
  const out = { ...slide };

  if (out.codeSnippet?.trim()) {
    if (!looksLikeCode(out.codeSnippet.trim())) {
      console.warn(
        `[${ctx}] Invalid codeSnippet removed (not code-like):`,
        out.codeSnippet.slice(0, 120)
      );
      delete out.codeSnippet;
    }
  }

  visualSuggestion = visualSuggestion.replace(/```(?:[^\n]*)\n([\s\S]*?)```/g, (full, inner) => {
    const t = String(inner).trim();
    if (t && !looksLikeCode(t)) {
      console.warn(`[${ctx}] Removed invalid fenced block from visualSuggestion`);
      return "";
    }
    return full;
  });
  out.visualSuggestion = visualSuggestion.trim();

  if (out.contentType === "code" && !getEffectiveCodeSnippet(out)) {
    console.warn(`[${ctx}] contentType was "code" but no valid code remained — degrading to bullets`);
    out.contentType = "bullets";
  }

  return sanitizeSlideVisual(out, ctx);
}

export function sanitizeLessonSlides(slides: SlideContent[]): SlideContent[] {
  return slides.map((s, i) => sanitizeSlideContent(s, `slide ${i + 1}`));
}
