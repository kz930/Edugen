"use client";

import type { LessonRecord, SlideContent } from "@/types/lesson";
import {
  buildMermaidFromSlide,
  useTwoColumnLayout,
} from "@/lib/slide-mermaid";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MermaidDiagram } from "@/components/lesson/MermaidDiagram";
import { cn } from "@/lib/utils";
import { Lightbulb, ChevronDown } from "lucide-react";
import { useMemo } from "react";

type UpdateSlide = (patch: Partial<SlideContent>) => void;

export function SlidePreviewCard({
  slide,
  slideIndex,
  totalSlides,
  editing,
  lesson,
  onUpdate,
}: {
  slide: SlideContent;
  slideIndex: number;
  totalSlides: number;
  editing: boolean;
  lesson: LessonRecord;
  onUpdate: UpdateSlide;
}) {
  const chart = useMemo(() => buildMermaidFromSlide(slide), [slide]);
  const twoCol = useTwoColumnLayout(slide, slideIndex, chart);

  const sourceChips = slide.sourceIds
    .map((id) => {
      const n = lesson.sources.findIndex((s) => s.id === id) + 1;
      return n > 0 ? { id, n } : null;
    })
    .filter(Boolean) as { id: string; n: number }[];

  if (editing) {
    return (
      <div className="rounded-xl bg-[#f5f5f5] p-6 md:p-8">
        <div className="rounded-lg border border-black/[0.06] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="h-1 w-full bg-primary" />
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

  return (
    <div className="rounded-xl bg-[#f5f5f5] p-6 md:p-8">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        )}
      >
        <div className="h-1 w-full bg-primary" aria-hidden />

        <div className="relative p-6 pb-14 pt-7 md:p-8 md:pb-16 md:pt-8">
          <h2
            className="font-bold leading-tight tracking-tight text-[#1a1a2e]"
            style={{ fontSize: "clamp(1.5rem, 2vw + 1rem, 2rem)" }}
          >
            {slide.title}
          </h2>

          {twoCol ? (
            <div className="mt-6 grid gap-8 md:grid-cols-2 md:items-start">
              <div className="min-w-0 space-y-5">
                {slide.mainIdea ? (
                  <p className="text-[17px] leading-[1.65] text-[#2d2d44]">{slide.mainIdea}</p>
                ) : null}
                {slide.bullets.length > 0 ? (
                  <ul className="space-y-3">
                    {slide.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-[17px] leading-[1.6] text-[#2d2d44]">
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="min-w-0">
                {chart ? (
                  <MermaidDiagram chart={chart} slideKey={`${slide.slideNumber}`} />
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-gradient-to-br from-primary/[0.06] to-slate-50/90 p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Lightbulb className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                    {(slide.visualIdea ?? slide.visualSuggestion) ? (
                      <p className="text-sm leading-relaxed text-slate-600">
                        {slide.visualIdea ?? slide.visualSuggestion}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Visual placeholder — add bullets or a visual suggestion to auto-draw a
                        diagram.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {slide.mainIdea ? (
                <p className="text-[17px] leading-[1.65] text-[#2d2d44]">{slide.mainIdea}</p>
              ) : null}
              {slide.bullets.length > 0 ? (
                <ul className="space-y-3">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[17px] leading-[1.6] text-[#2d2d44]">
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      <span className="min-w-0">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {chart ? (
                <MermaidDiagram chart={chart} slideKey={`${slide.slideNumber}-full`} />
              ) : null}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 md:bottom-4 md:left-4">
            {sourceChips.map(({ id, n }) => (
              <span
                key={id}
                className="pointer-events-auto inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
              >
                Source [{n}]
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 md:bottom-4 md:right-4">
            <span className="pointer-events-none inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-200/90 bg-white px-2 text-xs font-semibold tabular-nums text-slate-500 shadow-sm">
              {slide.slideNumber} / {totalSlides}
            </span>
          </div>
        </div>
      </div>

      <details className="group mt-4 overflow-hidden rounded-lg border border-amber-200/70 bg-[#fffbeb] shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-amber-950/90 hover:bg-amber-50/80 [&::-webkit-details-marker]:hidden">
          <span>Speaker notes</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-amber-800/70 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-amber-200/60 px-4 py-3 text-[15px] leading-relaxed text-amber-950/85">
          {slide.speakerNotes || (
            <span className="italic text-amber-800/60">No notes for this slide.</span>
          )}
        </div>
      </details>
    </div>
  );
}
