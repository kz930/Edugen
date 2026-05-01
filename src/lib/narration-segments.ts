/** Same sentence split as Remotion SlideVideo subtitles — keep preview in sync. */
export function splitNarrationSegments(
  narrationScript: string,
  titleFallback: string
): string[] {
  const raw = (narrationScript || titleFallback || "").trim();
  const parts = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.length ? parts : [raw || titleFallback];
}
