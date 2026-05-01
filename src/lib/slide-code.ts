export type SlideContentSegment =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string; language: string };

/** Split markdown-style ```fenced``` blocks from prose (used in slide body text). */
export function splitFencedCode(input: string): SlideContentSegment[] {
  const trimmed = input ?? "";
  if (!trimmed.trim()) return [];

  const re = /```([\w-]*)?\s*\n([\s\S]*?)```/g;
  const out: SlideContentSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    if (m.index > last) {
      const text = trimmed.slice(last, m.index);
      if (text.trim()) out.push({ kind: "text", text });
    }
    const lang = (m[1] ?? "text").trim() || "text";
    out.push({ kind: "code", code: m[2]!.replace(/\n$/, ""), language: lang });
    last = m.index + m[0].length;
  }
  if (last < trimmed.length) {
    const text = trimmed.slice(last);
    if (text.trim()) out.push({ kind: "text", text });
  }
  if (out.length === 0) return [{ kind: "text", text: trimmed }];
  return out;
}
