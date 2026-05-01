import type { LessonRecord, SlideContent } from "@/types/lesson";
import { getEffectiveCodeSnippet } from "@/lib/slide-code-snippet";
import { getSlideVisualPlan } from "@/lib/slide-mermaid";
import type { PreviewThemeId } from "@/config/lesson-editor-ui";

export type EditorSlideStatus = "ready" | "needs_script";

export interface EditorSlideRow {
  id: number;
  title: string;
  order: number;
  status: EditorSlideStatus;
  durationSeconds: number;
  contentType: "bullets" | "code" | "diagram" | "mixed";
  bullets: string[];
  script: string | null;
  hasDiagram: boolean;
  hasCode: boolean;
  codeSnippet: string | null;
  theme: PreviewThemeId;
}

export function slideHasCodeBlock(slide: SlideContent): boolean {
  return getEffectiveCodeSnippet(slide) != null;
}

export function extractCodeSnippet(slide: SlideContent): string | null {
  const code = getEffectiveCodeSnippet(slide);
  return code ? code.slice(0, 240) : null;
}

export function buildEditorSlideRows(
  lesson: LessonRecord,
  previewTheme: PreviewThemeId
): EditorSlideRow[] {
  const slides = lesson.lessonData.slides;
  const narration = lesson.lessonData.narration;

  return slides.map((slide, index) => {
    const narr = narration.find((n) => n.slideNumber === slide.slideNumber);
    const scriptRaw = narr?.script ?? "";
    const script = scriptRaw.trim() ? scriptRaw : null;
    const plan = getSlideVisualPlan(slide);
    const hasDiagram = plan.type !== "none";
    const hasCode = slideHasCodeBlock(slide);
    let contentType: EditorSlideRow["contentType"] = "bullets";
    if (hasCode && hasDiagram) contentType = "mixed";
    else if (hasCode) contentType = "code";
    else if (hasDiagram) contentType = "diagram";

    let status: EditorSlideStatus;
    if (!script?.trim()) status = "needs_script";
    else status = "ready";

    const durationSeconds =
      typeof narr?.estimatedDurationSeconds === "number" &&
      narr.estimatedDurationSeconds > 0
        ? narr.estimatedDurationSeconds
        : script
          ? 45
          : 0;

    return {
      id: slide.slideNumber,
      title: slide.title,
      order: index + 1,
      status,
      durationSeconds,
      contentType,
      bullets: slide.bullets,
      script,
      hasDiagram,
      hasCode,
      codeSnippet: extractCodeSnippet(slide),
      theme: previewTheme,
    };
  });
}

export function formatDurationParts(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return r ? `${m}m ${r}s` : `${m}m`;
}

/** Stats row: ready = script + diagram (per product brief). */
export function computeSlideStats(rows: EditorSlideRow[]) {
  const total = rows.length;
  const ready = rows.filter((r) => r.script?.trim() && r.hasDiagram).length;
  const estSeconds = rows.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
  const pending = rows.filter((r) => !r.script?.trim()).length;
  return { total, ready, estSeconds, pending };
}

/** Progress bar “completed” = slides with script + diagram */
export function completedForProgress(rows: EditorSlideRow[]): number {
  return rows.filter((r) => r.script?.trim() && r.hasDiagram).length;
}
