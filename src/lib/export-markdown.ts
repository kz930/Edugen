import type { LessonRecord, RetrievedSource } from "@/types/lesson";

function sourceCitationIndex(
  sources: RetrievedSource[],
  sourceId: string
): number {
  const i = sources.findIndex((s) => s.id === sourceId);
  return i >= 0 ? i + 1 : 0;
}

export function lessonToMarkdown(
  lesson: LessonRecord,
  options?: { slidesOnly?: boolean }
): string {
  const d = lesson.lessonData;
  const lines: string[] = [];

  lines.push(`# ${d.lessonTitle}`);
  lines.push("");
  lines.push(`**Topic:** ${lesson.topic}`);
  lines.push(`**Subject:** ${lesson.subject} · **Level:** ${lesson.level}`);
  lines.push(
    `**Goal:** ${lesson.learningGoal} · **Style:** ${lesson.explanationStyle}`
  );
  lines.push("");

  if (!options?.slidesOnly) {
    lines.push("## Overview");
    lines.push("");
    lines.push(d.overview.summary);
    lines.push("");
    lines.push("### Learning objectives");
    d.overview.learningObjectives.forEach((o) => lines.push(`- ${o}`));
    lines.push("");
    lines.push(
      `_Estimated time: ~${d.overview.estimatedTimeMinutes} minutes_`
    );
    lines.push("");

    lines.push("## Learning blueprint");
    lines.push("");
    lines.push("### Prerequisites");
    d.blueprint.prerequisites.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
    if (d.blueprint.coreConcept) {
      lines.push("### Core concept");
      lines.push(d.blueprint.coreConcept);
      lines.push("");
    }
    lines.push("### Key terms");
    d.blueprint.keyTerms.forEach((k) =>
      lines.push(`- **${k.term}**: ${k.definition}`)
    );
    lines.push("");
    lines.push("### Concept path");
    d.blueprint.conceptPath.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
    lines.push("");
    lines.push("### Common mistakes");
    d.blueprint.commonMistakes.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
    lines.push("### Recap");
    d.blueprint.recap.forEach((r) => lines.push(`- ${r}`));
    lines.push("");

    if (d.blueprint.examplePlan?.length) {
      lines.push("### Example plan");
      d.blueprint.examplePlan.forEach((e) => lines.push(`- ${e}`));
      lines.push("");
    }
  }

  lines.push("## Slides");
  lines.push("");
  d.slides.forEach((s) => {
    lines.push(`### Slide ${s.slideNumber}: ${s.title}`);
    lines.push("");
    lines.push(s.mainIdea);
    lines.push("");
    s.bullets.forEach((b) => lines.push(`- ${b}`));
    lines.push("");
    if (s.visualSuggestion) {
      lines.push(`_Visual suggestion:_ ${s.visualSuggestion}`);
      lines.push("");
    }
    lines.push(`_Speaker notes:_ ${s.speakerNotes}`);
    lines.push("");
    const cites = s.sourceIds
      .map((id) => sourceCitationIndex(lesson.sources, id))
      .filter((n) => n > 0);
    if (cites.length) {
      lines.push(`_Sources:_ [${cites.join(", ")}]`);
      lines.push("");
    }
  });

  if (!options?.slidesOnly) {
    lines.push("## Narration");
    lines.push("");
    d.narration.forEach((n) => {
      lines.push(`### Slide ${n.slideNumber} (~${n.estimatedDurationSeconds}s)`);
      lines.push("");
      lines.push(n.script);
      lines.push("");
    });

    lines.push("## Practice questions");
    lines.push("");
    d.practiceQuestions.forEach((q, i) => {
      lines.push(`### Q${i + 1} (${q.type})`);
      lines.push(q.question);
      lines.push("");
      if (q.choices?.length) {
        q.choices.forEach((c, j) => lines.push(`${j + 1}. ${c}`));
        lines.push("");
      }
    });

    lines.push("## Sources");
    lines.push("");
    lesson.sources.forEach((s, i) => {
      const used = lesson.lessonData.sourcesUsed.includes(s.id);
      lines.push(
        `${i + 1}. [${s.title}](${s.url}) — _${s.domain}_ (${s.type})${used ? " ✓ used" : ""}`
      );
      lines.push(`   > ${s.snippet.slice(0, 240)}${s.snippet.length > 240 ? "…" : ""}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slidesMarkdown(lesson: LessonRecord): string {
  return lessonToMarkdown(lesson, { slidesOnly: true });
}
