/**
 * Clean LLM / markdown visualSuggestion so Mermaid can parse it.
 */

const MERMAID_FIRST_LINE =
  /^\s*(flowchart|graph|sequenceDiagram|gitGraph|mindmap|stateDiagram|erDiagram|classDiagram|gantt|pie|journey|timeline|sankey|block-beta|C4Context|C4Container|requirement|quadrantChart)\b/i;

/**
 * Strip fences, optional `mermaid` label line, and leading prose so the
 * first line is a Mermaid diagram directive.
 */
export function normalizeMermaidInput(input: string): string {
  let s = input.trim();
  if (!s) return s;

  s = s.replace(/^\s*```(?:mermaid)?\s*\r?\n?/i, "");
  s = s.replace(/\r?\n```\s*$/g, "");
  s = s.trim();

  if (/^mermaid\s*\r?\n/i.test(s)) {
    s = s.replace(/^mermaid\s*\r?\n/i, "").trim();
  }

  let lines = s.split(/\r?\n/);

  while (lines.length && !lines[0]!.trim()) {
    lines.shift();
  }
  while (lines.length && /^\s*%%/.test(lines[0]!)) {
    lines.shift();
  }

  s = lines.join("\n").trim();
  lines = s.split(/\r?\n/);

  const first = lines[0]?.trim() ?? "";
  if (MERMAID_FIRST_LINE.test(first)) {
    return lines.join("\n").trim();
  }

  const idx = lines.findIndex((line) => MERMAID_FIRST_LINE.test(line.trim()));
  if (idx >= 0) {
    return lines.slice(idx).join("\n").trim();
  }

  return s.trim();
}

/** True if normalized text looks like a Mermaid diagram definition. */
export function looksLikeMermaidDiagram(normalized: string): boolean {
  const head = normalized.trim().split(/\r?\n/)[0]?.trim() ?? "";
  return MERMAID_FIRST_LINE.test(head);
}
