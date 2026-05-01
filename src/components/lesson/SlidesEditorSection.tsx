"use client";

import type { LessonRecord, SlideContent } from "@/types/lesson";
import { SlidePreviewCard } from "@/components/lesson/SlidePreviewCard";
import { Button } from "@/components/ui/button";
import {
  EDITOR_BORDER_STYLE,
  THEME_DISPLAY_LABEL,
  THEME_IDS,
  themeBadgeLabel,
} from "@/config/lesson-editor-ui";
import { themeTokens } from "@/themes/tokens";
import { useLessonTheme } from "@/contexts/LessonThemeContext";
import {
  buildEditorSlideRows,
  computeSlideStats,
  formatDurationParts,
  type EditorSlideRow,
} from "@/lib/editor-slide-model";
import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  lesson: LessonRecord;
  setLesson: Dispatch<SetStateAction<LessonRecord>>;
};

export function SlidesEditorSection({ lesson, setLesson }: Props) {
  const { themeName, setThemeName } = useLessonTheme();
  const rows = useMemo(
    () => buildEditorSlideRows(lesson, themeName),
    [lesson, themeName]
  );
  const stats = useMemo(() => computeSlideStats(rows), [rows]);
  const total = rows.length;

  const [themeModal, setThemeModal] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [inlineScriptId, setInlineScriptId] = useState<number | null>(null);
  const [inlineDraft, setInlineDraft] = useState("");
  const [regenConfirm, setRegenConfirm] = useState<number | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);

  const slides = lesson.lessonData.slides;

  const updateScriptForSlide = (slideNumber: number, script: string) => {
    setLesson((prev) => ({
      ...prev,
      lessonData: {
        ...prev.lessonData,
        narration: (() => {
          const list = [...prev.lessonData.narration];
          const i = list.findIndex((n) => n.slideNumber === slideNumber);
          if (i >= 0) {
            list[i] = {
              ...list[i]!,
              script,
              estimatedDurationSeconds: list[i]!.estimatedDurationSeconds || 45,
            };
          } else {
            list.push({
              slideNumber,
              script,
              estimatedDurationSeconds: 45,
            });
          }
          return list;
        })(),
      },
    }));
  };

  const handleRegenerate = async (slideNumber: number) => {
    setRegenLoading(true);
    try {
      const res = await fetch("/api/regenerate-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideNumber,
          topic: lesson.topic,
          lessonTitle: lesson.lessonData.lessonTitle,
          selectedSources: lesson.sources.filter((s) =>
            lesson.lessonData.sourcesUsed.includes(s.id)
          ),
          uploadedText: lesson.uploadedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regenerate failed");
      const newSlide = data.slide as SlideContent;
      setLesson((prev) => ({
        ...prev,
        lessonData: {
          ...prev.lessonData,
          slides: prev.lessonData.slides.map((s) =>
            s.slideNumber === newSlide.slideNumber ? newSlide : s
          ),
        },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setRegenLoading(false);
      setRegenConfirm(null);
    }
  };

  const openDraftScript = async (slideNumber: number) => {
    const slide = slides.find((s) => s.slideNumber === slideNumber);
    if (!slide) return;
    setInlineScriptId(slideNumber);
    let draft = "";
    try {
      const res = await fetch("/api/explain-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: `${slide.title}. ${slide.mainIdea}`,
          lessonContext: lesson.lessonData.overview.summary.slice(0, 4000),
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.explanation === "string") {
        draft = data.explanation.trim().slice(0, 1200);
      }
    } catch {
      draft = "";
    }
    if (!draft) {
      draft = [slide.mainIdea, ...slide.bullets.map((b) => `• ${b}`)]
        .join("\n")
        .slice(0, 800);
    }
    setInlineDraft(draft);
  };

  const slideForEdit = editIdx !== null ? slides[editIdx] ?? null : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Topbar */}
      <header
        className="sticky top-0 z-10 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b bg-white px-5 py-3"
        style={{ borderColor: "#E2E8F0", borderWidth: 0.5 }}
      >
        <div>
          <h2 className="text-sm font-medium text-[#0F172A]">Slides</h2>
          <p className="text-xs text-[#64748B]">
            {total} slides · {stats.ready} ready · {stats.pending} pending · ~
            {formatDurationParts(stats.estSeconds)} · click a slide to edit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${themeTokens[themeName].accent}22`,
              color: themeTokens[themeName].accent,
            }}
          >
            {themeBadgeLabel(themeName)}
          </span>
          <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs text-[#64748B]">
            ~{formatDurationParts(stats.estSeconds)} total
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 border border-[#E2E8F0] text-xs font-normal"
            onClick={() => setThemeModal(true)}
          >
            Change theme
          </Button>
        </div>
      </header>

      {/* Canvas workspace */}
      <div
        className="flex min-h-0 flex-1 overflow-y-auto"
        style={{
          backgroundColor: "#CCD3DE",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.22) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6">
          {total === 0 ? (
            <div
              className="rounded-xl border bg-white px-4 py-12 text-center text-sm text-[#64748B]"
              style={{ border: EDITOR_BORDER_STYLE }}
            >
              Slides were disabled for this lesson generation.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((row, idx) => (
                <SlideEditorCard
                  key={row.id}
                  row={row}
                  slideIndex={idx}
                  totalSlides={total}
                  onEdit={() => setEditIdx(idx)}
                  onRegenerate={() => setRegenConfirm(row.id)}
                  onPreview={() => setPreviewIdx(idx)}
                  onAddScript={() => void openDraftScript(row.id)}
                  inlineScriptOpen={inlineScriptId === row.id}
                  inlineDraft={inlineDraft}
                  setInlineDraft={setInlineDraft}
                  onSaveInlineScript={() => {
                    updateScriptForSlide(row.id, inlineDraft);
                    setInlineScriptId(null);
                  }}
                  onCancelInline={() => setInlineScriptId(null)}
                  onEditScript={() => {
                    const narr = lesson.lessonData.narration.find(
                      (n) => n.slideNumber === row.id
                    );
                    setInlineScriptId(row.id);
                    setInlineDraft(narr?.script ?? "");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Theme modal */}
      {themeModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl" style={{ borderColor: "#E2E8F0", borderWidth: 0.5 }}>
            <p className="text-sm font-medium text-[#0F172A]">Preview theme</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Applies to slide thumbnails here and to slide videos you generate.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {THEME_IDS.map((tid) => (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => {
                      setThemeName(tid);
                      try {
                        localStorage.setItem(
                          `edugen-preview-theme-${lesson.id}`,
                          tid
                        );
                      } catch {
                        /* ignore */
                      }
                      setThemeModal(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      themeName === tid
                        ? "border-[#0D9488] bg-[#F0FDF9]"
                        : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-md border border-black/10"
                      style={{ background: themeTokens[tid].accent }}
                    />
                    {THEME_DISPLAY_LABEL[tid]}
                  </button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setThemeModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}

      {/* Regenerate confirm */}
      {regenConfirm !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl" style={{ borderColor: "#E2E8F0", borderWidth: 0.5 }}>
            <p className="text-sm font-medium">Regenerate this slide?</p>
            <p className="mt-2 text-xs text-[#64748B]">
              Replaces slide content using your lesson context (OpenAI).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRegenConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={regenLoading}
                onClick={() => void handleRegenerate(regenConfirm)}
              >
                {regenLoading ? "Working…" : "Regenerate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Preview modal */}
      {previewIdx !== null && slides[previewIdx] ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4 md:p-10">
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewIdx(null)}
            >
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white p-4">
            <SlidePreviewCard
              slide={slides[previewIdx]!}
              slideIndex={previewIdx}
              totalSlides={slides.length}
              editing={false}
              lesson={lesson}
              onUpdate={() => {}}
              previewThemeId={themeName}
              narrationScript={
                lesson.lessonData.narration.find(
                  (n) => n.slideNumber === slides[previewIdx]!.slideNumber
                )?.script ?? ""
              }
            />
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      {editIdx !== null && slideForEdit ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4 md:p-10">
          <div className="mb-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditIdx(null)}
            >
              Done
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white p-4">
            <SlidePreviewCard
              slide={slideForEdit}
              slideIndex={editIdx}
              totalSlides={slides.length}
              editing
              lesson={lesson}
              previewThemeId={themeName}
              narrationScript={
                lesson.lessonData.narration.find(
                  (n) => n.slideNumber === slideForEdit.slideNumber
                )?.script ?? ""
              }
              onUpdate={(patch) => {
                setLesson((prev) => ({
                  ...prev,
                  lessonData: {
                    ...prev.lessonData,
                    slides: prev.lessonData.slides.map((s) =>
                      s.slideNumber === slideForEdit.slideNumber
                        ? { ...s, ...patch }
                        : s
                    ),
                  },
                }));
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SlideEditorCard({
  row,
  slideIndex,
  totalSlides,
  onEdit,
  onRegenerate,
  onPreview,
  onAddScript,
  inlineScriptOpen,
  inlineDraft,
  setInlineDraft,
  onSaveInlineScript,
  onCancelInline,
  onEditScript,
}: {
  row: EditorSlideRow;
  slideIndex: number;
  totalSlides: number;
  onEdit: () => void;
  onRegenerate: () => void;
  onPreview: () => void;
  onAddScript: () => void;
  inlineScriptOpen: boolean;
  inlineDraft: string;
  setInlineDraft: (s: string) => void;
  onSaveInlineScript: () => void;
  onCancelInline: () => void;
  onEditScript: () => void;
}) {
  const tok = themeTokens[row.theme];
  const needsScriptBorder = row.status === "needs_script";

  const metaParts: string[] = [];
  if (row.durationSeconds)
    metaParts.push(`~${row.durationSeconds}s est.`);
  metaParts.push(row.contentType);
  if (row.script?.trim() && !row.hasDiagram)
    metaParts.push("Add a diagram hint in Visual suggestion for best video layout.");

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-shadow hover:shadow-md"
      style={{
        border: EDITOR_BORDER_STYLE,
        borderColor: needsScriptBorder ? "#FCD34D" : "#E2E8F0",
      }}
    >
      {/* 16:9 slide frame */}
      <div
        className="relative w-full shrink-0 overflow-hidden pt-[56.25%]"
        style={{ background: tok.bg }}
      >
        <div className="absolute inset-0 flex flex-col p-3 sm:p-3.5">
          <div className="absolute right-2 top-2">
            <StatusBadge status={row.status} />
          </div>
          <div
            className="h-[3px] w-full shrink-0 rounded-sm"
            style={{
              background: `linear-gradient(90deg, ${tok.topBarStart}, ${tok.topBarEnd})`,
            }}
          />
          <p
            className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight sm:text-xs"
            style={{ color: tok.textPrimary }}
          >
            {row.title.slice(0, 100)}
          </p>
          <ul className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-hidden">
            {row.bullets.slice(0, 4).map((b, i) => (
              <li
                key={i}
                className="flex gap-1 text-[8px] leading-snug sm:text-[9px]"
                style={{ color: tok.textMuted }}
              >
                <span className="shrink-0" style={{ color: tok.accent }}>
                  ●
                </span>
                <span className="line-clamp-2">{b.slice(0, 90)}</span>
              </li>
            ))}
          </ul>
          {row.hasDiagram ? (
            <div className="mt-auto flex flex-col gap-0.5 pt-1">
              {([tok.nodes.primary, tok.nodes.secondary, tok.nodes.highlight] as const).map(
                (node, i) => (
                  <div
                    key={i}
                    className="rounded px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                    style={{
                      background: node.bg,
                      color: node.text,
                      border: `1px solid ${node.border}`,
                    }}
                  >
                    {["Step A", "Step B", "Step C"][i]}
                  </div>
                )
              )}
            </div>
          ) : null}
          {row.hasCode ? (
            <pre
              className="mt-1 max-h-[36px] overflow-hidden rounded p-1 text-[7px] leading-tight"
              style={{
                background: tok.code.bg,
                color: tok.code.string,
              }}
            >
              {(row.codeSnippet ?? "code").slice(0, 100)}
            </pre>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] text-[#64748B]">
            Slide {slideIndex + 1} of {totalSlides}
          </p>
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[#0F172A]">
            {row.title}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] leading-snug text-[#64748B]">
          {metaParts.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-[#E2E8F0] text-xs"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-[#E2E8F0] text-xs"
            onClick={onRegenerate}
          >
            Regenerate
          </Button>
          {row.status === "ready" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 bg-[#0D9488] px-3 text-xs text-white hover:bg-[#0D9488]/90"
              onClick={onPreview}
            >
              Preview
            </Button>
          ) : null}
          {row.status === "needs_script" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 bg-[#FCD34D] px-3 text-xs font-medium text-[#78350F] hover:bg-[#FCD34D]/90"
              onClick={onAddScript}
            >
              Add script
            </Button>
          ) : null}
        </div>
      </div>

      {inlineScriptOpen ? (
        <div
          className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
          style={{ borderWidth: 0.5 }}
        >
          <Textarea
            rows={5}
            value={inlineDraft}
            onChange={(e) => setInlineDraft(e.target.value)}
            className="text-sm"
            placeholder="Narration script…"
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" onClick={onSaveInlineScript}>
              Save script
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancelInline}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5"
        style={{ borderWidth: 0.5 }}
      >
        <p className="max-w-[75%] text-[11px] italic text-[#64748B]">
          {row.script?.trim()
            ? row.script.slice(0, 160) + (row.script.length > 160 ? "…" : "")
            : "No narration script yet — tap to generate one."}
        </p>
        <button
          type="button"
          className="shrink-0 text-[11px] font-medium text-[#0D9488] hover:underline"
          onClick={onEditScript}
        >
          Edit script
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EditorSlideRow["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0D9488]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
        Ready
      </span>
    );
  }
  if (status === "needs_script") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#F59E0B]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
        Needs script
      </span>
    );
  }
  return null;
}
