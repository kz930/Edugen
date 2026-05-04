"use client";

import type { LessonRecord, SlideContent } from "@/types/lesson";
import {
  buildDiagramPlan,
  buildMermaidFromSlide,
  useTwoColumnLayout,
} from "@/lib/slide-mermaid";
import {
  extractRawFenceInner,
  getEffectiveCodeSnippet,
  hasCodePlaceholder,
  inferCodeLanguage,
} from "@/lib/slide-code-snippet";
import { splitNarrationSegments } from "@/lib/narration-segments";
import type { PreviewThemeId } from "@/themes/tokens";
import { themeFontStack, themeTokens } from "@/themes/tokens";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/lesson/MermaidDiagram";
import { SlideFlowDiagram } from "@/components/lesson/SlideFlowDiagram";
import { SlideRichBody } from "@/components/lesson/SlideRichBody";
import { SlideCodeBlock } from "@/components/lesson/SlideCodeBlock";
import { VisualSlideRenderer } from "@/components/lesson/VisualSlideRenderer";
import { isValidVisualSlide } from "@/lib/validate-visual-slide";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Cpu,
  GitBranch,
  Layers,
  Lightbulb,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type UpdateSlide = (patch: Partial<SlideContent>) => void;

const BULLET_ICONS = [
  Sparkles,
  Target,
  BookOpen,
  Cpu,
  GitBranch,
  Lightbulb,
  CircleDot,
  CheckCircle2,
  Layers,
  Zap,
] as const;

export function SlidePreviewCard({
  slide,
  slideIndex,
  totalSlides,
  editing,
  lesson,
  onUpdate,
  previewThemeId,
  narrationScript = "",
}: {
  slide: SlideContent;
  slideIndex: number;
  totalSlides: number;
  editing: boolean;
  lesson: LessonRecord;
  onUpdate: UpdateSlide;
  previewThemeId: PreviewThemeId;
  narrationScript?: string;
}) {
  const tokens = themeTokens[previewThemeId];
  const plan = useMemo(() => buildDiagramPlan(slide), [slide]);
  const chart = useMemo(() => buildMermaidFromSlide(slide), [slide]);
  const twoCol = useTwoColumnLayout(slide, slideIndex, plan);

  const segments = useMemo(
    () => splitNarrationSegments(narrationScript, slide.title),
    [narrationScript, slide.title]
  );
  const effectiveCode = useMemo(() => getEffectiveCodeSnippet(slide), [slide]);
  const codeLang = useMemo(() => inferCodeLanguage(slide), [slide]);
  const hasStoryboard = useMemo(
    () => slide.visual != null && isValidVisualSlide(slide.visual),
    [slide.visual]
  );
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [codeRecovering, setCodeRecovering] = useState(false);

  useEffect(() => {
    setSubtitleIdx(0);
  }, [slide.slideNumber, narrationScript]);

  const subtitleSafe = Math.min(subtitleIdx, Math.max(0, segments.length - 1));
  const subtitleText = segments[subtitleSafe] ?? "";

  async function regenerateSlideCode() {
    const desc =
      slide.codeSnippet?.trim() ||
      extractRawFenceInner(slide.visualSuggestion ?? "")?.trim() ||
      slide.visualSuggestion?.trim() ||
      "";
    if (!desc) return;
    setCodeRecovering(true);
    try {
      const res = await fetch("/api/regenerate-slide-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not generate code");
      }
      if (data.code) {
        onUpdate({ codeSnippet: data.code });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCodeRecovering(false);
    }
  }

  const sourceChips = slide.sourceIds
    .map((id) => {
      const n = lesson.sources.findIndex((s) => s.id === id) + 1;
      return n > 0 ? { id, n } : null;
    })
    .filter(Boolean) as { id: string; n: number }[];

  const titleFont = themeFontStack("fontTitle", tokens);
  const bodyFont = themeFontStack("fontBody", tokens);

  if (editing) {
    return (
      <div className="rounded-xl bg-[#f5f5f5] p-6 md:p-8">
        <div className="rounded-lg border border-black/[0.06] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="h-1 w-full" style={{ backgroundColor: tokens.accent }} />
          <div className="space-y-4 p-6 md:p-8">
            <Input
              className="text-xl font-bold"
              value={slide.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
            <Textarea
              rows={3}
              value={slide.mainIdea}
              onChange={(e) => onUpdate({ mainIdea: e.target.value })}
            />
            <ul className="space-y-2">
              {slide.bullets.map((b, i) => (
                <li key={i}>
                  <Input
                    value={b}
                    onChange={(e) => {
                      const bullets = [...slide.bullets];
                      bullets[i] = e.target.value;
                      onUpdate({ bullets });
                    }}
                  />
                </li>
              ))}
            </ul>
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Visual suggestion (optional Mermaid: flowchart TB / graph LR …)
              </span>
              <Input
                className="mt-1"
                value={slide.visualSuggestion}
                onChange={(e) => onUpdate({ visualSuggestion: e.target.value })}
              />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Code snippet (optional — raw source only)
              </span>
              <Textarea
                className="mt-1 font-mono text-sm"
                rows={6}
                value={slide.codeSnippet ?? ""}
                onChange={(e) =>
                  onUpdate({
                    codeSnippet: e.target.value ? e.target.value : undefined,
                  })
                }
                placeholder="def factorial(n): ..."
              />
            </div>
            <Textarea
              value={slide.speakerNotes}
              onChange={(e) => onUpdate({ speakerNotes: e.target.value })}
              rows={4}
              placeholder="Speaker notes"
            />
            <div className="flex flex-wrap gap-2">
              {sourceChips.map(({ id, n }) => (
                <span
                  key={id}
                  className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  Source [{n}]
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visualPanel = (() => {
    if (effectiveCode) {
      return (
        <SlideCodeBlock
          code={effectiveCode}
          language={codeLang}
          className="w-full min-w-0"
        />
      );
    }
    if (plan.type === "flow") {
      return <SlideFlowDiagram plan={plan} tokens={tokens} />;
    }
    if (plan.type === "mermaid" && chart) {
      return (
        <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
          <MermaidDiagram chart={chart} slideKey={`${slide.slideNumber}`} surface="dark" />
        </div>
      );
    }
    return null;
  })();

  const layoutTwoCol = twoCol && visualPanel != null;

  const bulletRow = (text: string, i: number) => {
    const Icon = BULLET_ICONS[i % BULLET_ICONS.length]!;
    return (
      <li key={i} className="flex gap-4">
        <span
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ring-1"
          style={{
            backgroundColor: `${tokens.accent}22`,
            color: tokens.accent,
            borderColor: `${tokens.accent}44`,
          }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3" style={{ color: tokens.textMuted }}>
          <SlideRichBody
            text={text}
            className="space-y-3"
            proseClassName="!text-inherit text-[17px]"
          />
        </div>
      </li>
    );
  };

  return (
    <div
      className="rounded-2xl shadow-xl ring-1"
      style={{
        borderColor: tokens.border,
        backgroundColor: tokens.bg,
        color: tokens.textPrimary,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-[14px] md:rounded-[15px]"
        style={{ fontFamily: bodyFont }}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${tokens.topBarStart}, ${tokens.topBarEnd})`,
          }}
          aria-hidden
        />

        <div className="relative px-5 pb-28 pt-8 md:px-10 md:pb-32 md:pt-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: tokens.accent }}>
            Slide deck
          </p>
          <h2
            className="mt-2 max-w-4xl text-3xl font-extrabold leading-[1.15] tracking-tight md:text-[2.15rem]"
            style={{ fontFamily: titleFont, color: tokens.textPrimary }}
          >
            {slide.title}
          </h2>

          {hasCodePlaceholder(slide) ? (
            <button
              type="button"
              disabled={codeRecovering}
              onClick={() => void regenerateSlideCode()}
              className="mt-5 w-full rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2.5 text-left text-sm font-medium text-amber-950 shadow-sm transition hover:bg-amber-500/25 disabled:opacity-60 dark:text-amber-50"
            >
              ⚠ Code placeholder detected — click to generate real code
              {codeRecovering ? " …" : ""}
            </button>
          ) : null}

          {hasStoryboard ? (
            <div className="mt-8 space-y-10">
              <VisualSlideRenderer slide={slide} />
              {slide.mainIdea ? (
                <div style={{ color: tokens.textMuted }}>
                  <SlideRichBody
                    text={slide.mainIdea}
                    proseClassName="!text-inherit text-lg leading-relaxed md:text-[1.125rem]"
                  />
                </div>
              ) : null}
              {slide.bullets.length > 0 ? (
                <ul className="space-y-6">{slide.bullets.map((b, i) => bulletRow(b, i))}</ul>
              ) : null}
            </div>
          ) : layoutTwoCol ? (
            <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
              <div className="min-w-0 space-y-8">
                {slide.mainIdea ? (
                  <div style={{ color: tokens.textMuted }}>
                    <SlideRichBody
                      text={slide.mainIdea}
                      proseClassName="!text-inherit text-lg leading-relaxed md:text-[1.125rem]"
                    />
                  </div>
                ) : null}
                {slide.bullets.length > 0 ? (
                  <ul className="space-y-6">{slide.bullets.map((b, i) => bulletRow(b, i))}</ul>
                ) : null}
              </div>
              <div className="min-w-0 w-full">{visualPanel}</div>
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {slide.mainIdea ? (
                <div style={{ color: tokens.textMuted }}>
                  <SlideRichBody
                    text={slide.mainIdea}
                    proseClassName="!text-inherit text-lg leading-relaxed md:text-[1.125rem]"
                  />
                </div>
              ) : null}
              {slide.bullets.length > 0 ? (
                <ul className="space-y-6">{slide.bullets.map((b, i) => bulletRow(b, i))}</ul>
              ) : null}
              {effectiveCode ? (
                <SlideCodeBlock
                  code={effectiveCode}
                  language={codeLang}
                  className="w-full min-w-0"
                />
              ) : plan.type === "flow" ? (
                <SlideFlowDiagram plan={plan} tokens={tokens} />
              ) : plan.type === "mermaid" && chart ? (
                <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
                  <MermaidDiagram chart={chart} slideKey={`${slide.slideNumber}-full`} surface="dark" />
                </div>
              ) : null}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-16 left-4 flex flex-wrap gap-2 md:left-6">
            {sourceChips.map(({ id, n }) => (
              <span
                key={id}
                className="pointer-events-auto inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow backdrop-blur-sm"
                style={{
                  borderColor: tokens.border,
                  backgroundColor: tokens.bgSecondary,
                  color: tokens.textMuted,
                }}
              >
                Source [{n}]
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-16 right-4 md:right-6">
            <span
              className="pointer-events-none inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg border px-2.5 text-xs font-bold tabular-nums shadow-inner"
              style={{
                borderColor: tokens.border,
                backgroundColor: tokens.bgSecondary,
                color: tokens.textPrimary,
              }}
            >
              {slide.slideNumber} / {totalSlides}
            </span>
          </div>

          <div
            className="pointer-events-auto absolute bottom-4 left-4 right-4 rounded-lg border px-3 py-2 md:left-6 md:right-6"
            style={{
              borderColor: tokens.border,
              backgroundColor: tokens.bgSecondary,
            }}
          >
            <p className="text-center text-sm leading-snug md:text-base" style={{ color: tokens.textPrimary }}>
              {hasStoryboard
                ? "Step subtitles play inside the visual workspace above (synced to each graph frame)."
                : subtitleText || "—"}
            </p>
            {!hasStoryboard && segments.length > 1 ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setSubtitleIdx((i) => Math.max(0, i - 1))}
                >
                  Previous sentence
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() =>
                    setSubtitleIdx((i) => Math.min(segments.length - 1, i + 1))
                  }
                >
                  Next sentence
                </Button>
                <span className="text-[11px]" style={{ color: tokens.textMuted }}>
                  Preview subtitles · {subtitleSafe + 1} / {segments.length}
                </span>
              </div>
            ) : !hasStoryboard ? (
              <p className="mt-1 text-center text-[11px]" style={{ color: tokens.textMuted }}>
                Matches video subtitle timing (one sentence shown per segment).
              </p>
            ) : (
              <p className="mt-1 text-center text-[11px]" style={{ color: tokens.textMuted }}>
                Visual slides use per-step captions in the panel above instead of narration segments here.
              </p>
            )}
          </div>
        </div>
      </div>

      <details
        className="group mt-4 overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm"
        style={{ borderColor: tokens.border, backgroundColor: tokens.bgSecondary }}
      >
        <summary
          className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden"
          style={{ color: tokens.textPrimary }}
        >
          <span>Speaker notes</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t px-4 py-4 text-[15px] leading-relaxed" style={{ borderColor: tokens.border }}>
          {slide.speakerNotes ? (
            <div style={{ color: tokens.textMuted }}>
              <SlideRichBody
                text={slide.speakerNotes}
                proseClassName="!text-inherit text-[15px]"
              />
            </div>
          ) : (
            <span className="italic opacity-60">No notes for this slide.</span>
          )}
        </div>
      </details>
    </div>
  );
}
