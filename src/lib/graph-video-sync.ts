import type { SlideContent } from "@/types/lesson";
import type { GraphVisualSlide } from "@/types/visual-slide";
import { isGraphVisual } from "@/types/visual-slide";

/** Single spoken script for TTS — step narrations in order (matches on-screen progression). */
export function audioScriptFromGraphVisual(visual: GraphVisualSlide): string {
  return visual.steps
    .map((s) => s.narration.trim())
    .filter(Boolean)
    .join(" ");
}

/** Per-step weights for syncing frames to audio duration (longer narration → longer time slice). */
export function graphStepCharWeights(visual: GraphVisualSlide): number[] {
  return visual.steps.map((s) => Math.max(8, s.narration.trim().length));
}

/**
 * Which graph step should be shown at time `tSeconds`, assuming audio covers `durationSeconds`
 * and each step's share is proportional to its narration length.
 */
export function graphStepIndexAtTime(
  tSeconds: number,
  durationSeconds: number,
  weights: number[]
): number {
  if (weights.length === 0) return 0;
  const dur = Math.max(durationSeconds, 0.001);
  const frac = Math.min(1, Math.max(0, tSeconds / dur));
  const total = weights.reduce((a, b) => a + b, 0);
  let threshold = 0;
  for (let i = 0; i < weights.length; i++) {
    const span = weights[i]! / total;
    threshold += span;
    if (frac <= threshold || i === weights.length - 1) {
      return i;
    }
  }
  return weights.length - 1;
}

/**
 * Video/TTS script: for graph slides use step narrations so audio matches the animation;
 * otherwise use the lesson narration script from the editor.
 */
export function getEffectiveVideoNarrationScript(
  slide: SlideContent,
  lessonNarrationScript: string
): string {
  const v = slide.visual;
  if (isGraphVisual(v) && v.steps?.length) {
    const fromGraph = audioScriptFromGraphVisual(v);
    if (fromGraph.trim()) return fromGraph.trim();
  }
  return lessonNarrationScript;
}
