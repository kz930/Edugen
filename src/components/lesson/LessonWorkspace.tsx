"use client";

import type {
  GeneratedLessonData,
  LessonRecord,
  PracticeQuestion,
  RetrievedSource,
  SlideContent,
} from "@/types/lesson";
import { isGraphVisual } from "@/types/visual-slide";
import { SlidesEditorSection } from "@/components/lesson/SlidesEditorSection";
import { EDITOR_PAGE_BG, type PreviewThemeId } from "@/config/lesson-editor-ui";
import {
  LessonThemeProvider,
  useLessonTheme,
} from "@/contexts/LessonThemeContext";
import {
  buildEditorSlideRows,
  completedForProgress,
} from "@/lib/editor-slide-model";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  downloadTextFile,
  lessonToMarkdown,
  slidesMarkdown,
} from "@/lib/export-markdown";
import { saveLessonRecord } from "@/lib/storage";
import { upsertMysqlLesson } from "@/lib/mysql-lessons-client";
import { getEffectiveVideoNarrationScript } from "@/lib/graph-video-sync";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  Download,
  Layers,
  Link2,
  Loader2,
  Save,
  Sparkles,
  Square,
  Video,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Section =
  | "overview"
  | "blueprint"
  | "slides"
  | "video"
  | "practice"
  | "sources";

const NAV: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", Icon: BookOpen },
  { id: "blueprint", label: "Learning blueprint", Icon: Layers },
  { id: "slides", label: "Slides", Icon: ClipboardList },
  { id: "video", label: "Video", Icon: Video },
  { id: "practice", label: "Practice", Icon: Sparkles },
  { id: "sources", label: "Sources", Icon: Link2 },
];

export function LessonWorkspace({ initial }: { initial: LessonRecord }) {
  const [lesson, setLesson] = useState<LessonRecord>(initial);

  useEffect(() => {
    setLesson(initial);
  }, [initial]);

  return (
    <LessonThemeProvider lessonId={lesson.id}>
      <LessonWorkspaceInner lesson={lesson} setLesson={setLesson} />
    </LessonThemeProvider>
  );
}

function LessonWorkspaceInner({
  lesson,
  setLesson,
}: {
  lesson: LessonRecord;
  setLesson: Dispatch<SetStateAction<LessonRecord>>;
}) {
  const { themeName } = useLessonTheme();
  const [section, setSection] = useState<Section>("slides");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const persist = useCallback(async () => {
    saveLessonRecord(lesson);
    const mysql = await upsertMysqlLesson(lesson);
    const bits = ["Saved in this browser."];
    if (mysql.enabled && mysql.ok) bits.push("MySQL");
    else if (mysql.enabled && !mysql.ok)
      bits.push(`MySQL error: ${mysql.error ?? "failed"} (local only)`);
    setSaveMsg(bits.join(" "));
    setTimeout(() => setSaveMsg(null), 5000);
  }, [lesson]);

  const d = lesson.lessonData;
  const slides = d.slides;

  const editorRows = useMemo(
    () => buildEditorSlideRows(lesson, themeName),
    [lesson, themeName]
  );
  const completedSlides = completedForProgress(editorRows);
  const totalSlides = slides.length;
  const progressPct = totalSlides
    ? Math.min(100, (completedSlides / totalSlides) * 100)
    : 0;

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F8FAFC] md:flex-row"
      style={{ backgroundColor: EDITOR_PAGE_BG }}
    >
      <aside
        className="relative z-20 hidden min-h-screen w-[220px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white md:sticky md:top-0 md:flex md:h-screen md:min-h-0"
        style={{ borderWidth: 0.5 }}
      >
        <div className="p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0D9488] text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight text-[#0F172A]">
                {lesson.topic}
              </p>
              <p className="truncate text-[11px] text-[#64748B]">
                {lesson.subject}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#64748B]">
              <span>Progress</span>
              <span>
                {completedSlides} / {totalSlides} slides
              </span>
            </div>
            <div className="h-1 w-full rounded-[2px] bg-[#F1F5F9]">
              <div
                className="h-1 rounded-[2px] bg-[#0D9488] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#64748B]">
            LESSON
          </p>
          <nav className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto">
            {NAV.map((n) => {
              const Icon = n.Icon;
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-2 border-l-2 px-4 text-left text-[13px] transition-colors",
                    active
                      ? "border-[#0D9488] bg-[#F0FDF9] font-medium text-[#0D9488]"
                      : "border-transparent font-normal text-[#64748B] hover:bg-[#F8FAFC]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="truncate">{n.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[72px] md:pb-0">
        <header
          className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white px-4 py-3 md:px-5"
          style={{ borderWidth: 0.5 }}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link
              href="/library"
              className="shrink-0 text-sm text-[#64748B] hover:text-[#0F172A]"
            >
              ← Saved lessons
            </Link>
            <span className="hidden text-[#CBD5E1] md:inline">|</span>
            <h1 className="truncate text-sm font-semibold text-[#0F172A] md:text-base">
              {d.lessonTitle}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => void persist()}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <ExportDropdown lesson={lesson} />
          </div>
        </header>
        {saveMsg ? (
          <p className="border-b border-[#E2E8F0] bg-white px-4 py-1.5 text-xs text-[#64748B] md:px-5">
            {saveMsg}
          </p>
        ) : null}

        {section === "slides" ? (
          <SlidesEditorSection lesson={lesson} setLesson={setLesson} />
        ) : (
          <main
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6"
            )}
          >
            <div className="mx-auto max-w-4xl space-y-6">
              {section === "overview" ? (
                <OverviewSection lesson={lesson} />
              ) : null}
              {section === "blueprint" ? (
                <BlueprintSection data={d} />
              ) : null}
              {section === "video" ? (
                <VideoSection lesson={lesson} setLesson={setLesson} />
              ) : null}
              {section === "practice" ? (
                <PracticeSection lesson={lesson} />
              ) : null}
              {section === "sources" ? (
                <SourcesSection lesson={lesson} />
              ) : null}
              <p className="text-xs text-[#64748B]">
                Edugen is a study support tool. It may make mistakes. Always
                verify important information with your instructor, textbook, or
                cited sources.
              </p>
            </div>
          </main>
        )}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#E2E8F0] bg-white px-1 py-2 md:hidden"
        style={{ borderWidth: 0.5 }}
      >
        {NAV.map((n) => {
          const Icon = n.Icon;
          const active = section === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSection(n.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] leading-tight",
                active ? "font-medium text-[#0D9488]" : "text-[#64748B]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="line-clamp-2 text-center">
                {n.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function OverviewSection({ lesson }: { lesson: LessonRecord }) {
  const d = lesson.lessonData;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Topic</p>
            <p className="font-medium">{lesson.topic}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Subject</p>
            <p>{lesson.subject}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Level</p>
            <p>{lesson.level}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Goal</p>
            <p>{lesson.learningGoal}</p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Estimated lesson length
          </p>
          <p>~{d.overview.estimatedTimeMinutes} minutes</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Summary</p>
          <p className="leading-relaxed text-foreground">{d.overview.summary}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Learning objectives
          </p>
          <ul className="list-inside list-disc space-y-1">
            {d.overview.learningObjectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function BlueprintSection({ data }: { data: GeneratedLessonData }) {
  const b = data.blueprint;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Learning blueprint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 font-semibold">Prerequisite knowledge</h3>
          <ul className="list-inside list-disc space-y-1">
            {b.prerequisites.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
        {b.coreConcept ? (
          <section>
            <h3 className="mb-2 font-semibold">Core concept</h3>
            <p className="leading-relaxed">{b.coreConcept}</p>
          </section>
        ) : null}
        <section>
          <h3 className="mb-2 font-semibold">Key terms</h3>
          <dl className="space-y-2">
            {b.keyTerms.map((k, i) => (
              <div key={i}>
                <dt className="font-medium text-foreground">{k.term}</dt>
                <dd className="text-muted-foreground">{k.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Step-by-step path</h3>
          <ol className="list-inside list-decimal space-y-1">
            {b.conceptPath.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </section>
        {b.examplePlan?.length ? (
          <section>
            <h3 className="mb-2 font-semibold">Example plan</h3>
            <ul className="list-inside list-disc space-y-1">
              {b.examplePlan.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section>
          <h3 className="mb-2 font-semibold">Common mistakes</h3>
          <ul className="list-inside list-disc space-y-1">
            {b.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Recap</h3>
          <ul className="list-inside list-disc space-y-1">
            {b.recap.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

type VideoGenState =
  | { status: "idle" }
  | { status: "audio" }
  | { status: "video" }
  | { status: "done"; videoUrl: string }
  | { status: "error"; message: string };

async function runSlideVideoPipeline(
  slideNumber: number,
  slide: SlideContent,
  lessonNarrationScript: string,
  themeName: PreviewThemeId,
  onPhase: (phase: "audio" | "video") => void
): Promise<
  | {
      ok: true;
      videoUrl: string;
      scriptUsed: string;
      durationInSeconds: number;
    }
  | { ok: false; message: string }
> {
  const scriptUsed = getEffectiveVideoNarrationScript(
    slide,
    lessonNarrationScript
  );
  try {
    onPhase("audio");
    const audioRes = await fetch("/api/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: scriptUsed, slideIndex: slideNumber }),
    });
    const audioData = await audioRes.json();
    if (!audioRes.ok) {
      throw new Error(audioData.error ?? "Audio generation failed");
    }
    const { audioUrl, durationInSeconds: audioDurGuess } = audioData as {
      audioUrl: string;
      durationInSeconds?: number;
    };

    onPhase("video");
    const renderRes = await fetch("/api/render-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slideIndex: slideNumber,
        title: slide.title,
        bullets: slide.bullets,
        mainIdea: slide.mainIdea,
        visualSuggestion: slide.visualSuggestion,
        visualIdea: slide.visualIdea,
        codeSnippet: slide.codeSnippet,
        audioUrl,
        durationInSeconds:
          typeof audioDurGuess === "number" && audioDurGuess > 0
            ? audioDurGuess
            : 30,
        narrationScript: scriptUsed,
        themeName,
        visual: slide.visual ?? undefined,
      }),
    });
    const renderData = await renderRes.json();
    if (!renderRes.ok) {
      const detail =
        typeof renderData.detail === "string" ? renderData.detail : "";
      const err =
        typeof renderData.error === "string" ? renderData.error : "Video render failed";
      throw new Error(detail ? `${err}: ${detail}` : err);
    }
    const { videoUrl, durationInSeconds: renderDur } = renderData as {
      videoUrl: string;
      durationInSeconds?: number;
    };
    const durationInSeconds =
      typeof renderDur === "number" &&
      Number.isFinite(renderDur) &&
      renderDur > 0
        ? renderDur
        : typeof audioDurGuess === "number" && audioDurGuess > 0
          ? audioDurGuess
          : 10;

    return {
      ok: true,
      videoUrl,
      scriptUsed,
      durationInSeconds,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, message };
  }
}

function VideoSection({
  lesson,
  setLesson,
}: {
  lesson: LessonRecord;
  setLesson: Dispatch<SetStateAction<LessonRecord>>;
}) {
  const { themeName } = useLessonTheme();
  const narr = lesson.lessonData.narration;
  const slides = lesson.lessonData.slides;
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const hydratedVideos = useMemo(() => {
    const urls = lesson.lessonData.slideVideoUrls;
    if (!urls) return {};
    const o: Record<number, VideoGenState> = {};
    for (const [k, url] of Object.entries(urls)) {
      const n = Number(k);
      if (Number.isInteger(n) && url) {
        o[n] = { status: "done", videoUrl: url };
      }
    }
    return o;
  }, [lesson.lessonData.slideVideoUrls]);

  const [videoBySlide, setVideoBySlide] =
    useState<Record<number, VideoGenState>>(hydratedVideos);

  useEffect(() => {
    setVideoBySlide((prev) => {
      const next = { ...prev };
      for (const [k, url] of Object.entries(lesson.lessonData.slideVideoUrls ?? {})) {
        const n = Number(k);
        if (!Number.isInteger(n) || !url) continue;
        const cur = next[n];
        if (!cur || cur.status === "idle") {
          next[n] = { status: "done", videoUrl: url };
        }
      }
      return next;
    });
  }, [lesson.lessonData.slideVideoUrls, lesson.id]);

  const [playing, setPlaying] = useState<number | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLabel, setBatchLabel] = useState<string | null>(null);

  const slideFor = (slideNumber: number) =>
    slides.find((s) => s.slideNumber === slideNumber);

  const speak = (slideNumber: number, text: string) => {
    synth?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setPlaying(null);
    setPlaying(slideNumber);
    synth?.speak(u);
  };

  const stop = () => {
    synth?.cancel();
    setPlaying(null);
  };

  const updateScript = (slideNumber: number, script: string) => {
    setLesson((prev) => ({
      ...prev,
      lessonData: {
        ...prev.lessonData,
        narration: prev.lessonData.narration.map((n) =>
          n.slideNumber === slideNumber ? { ...n, script } : n
        ),
      },
    }));
  };

  const generateAllSlideVideos = async () => {
    const list = narr.filter((n) => n.script.trim());
    if (!list.length) {
      setBatchLabel("Add subtitle script to at least one slide first.");
      setTimeout(() => setBatchLabel(null), 4500);
      return;
    }

    setBatchRunning(true);
    setBatchLabel("Starting…");

    for (let i = 0; i < list.length; i++) {
      const n = list[i]!;
      const slide = slideFor(n.slideNumber);
      if (!slide) {
        setVideoBySlide((prev) => ({
          ...prev,
          [n.slideNumber]: {
            status: "error",
            message: "No slide content for this slide.",
          },
        }));
        continue;
      }

      setBatchLabel(
        `Slide ${n.slideNumber} (${i + 1} / ${list.length}): generating audio…`
      );
      setVideoBySlide((prev) => ({ ...prev, [n.slideNumber]: { status: "audio" } }));

      const result = await runSlideVideoPipeline(
        n.slideNumber,
        slide,
        n.script,
        themeName,
        (phase) => {
          setVideoBySlide((prev) => ({ ...prev, [n.slideNumber]: { status: phase } }));
          if (phase === "video") {
            setBatchLabel(
              `Slide ${n.slideNumber} (${i + 1} / ${list.length}): rendering video…`
            );
          }
        }
      );

      if (!result.ok) {
        setVideoBySlide((prev) => ({
          ...prev,
          [n.slideNumber]: { status: "error", message: result.message },
        }));
        continue;
      }

      setVideoBySlide((prev) => ({
        ...prev,
        [n.slideNumber]: { status: "done", videoUrl: result.videoUrl },
      }));
      setLesson((prev) => {
        const updated: LessonRecord = {
          ...prev,
          lessonData: {
            ...prev.lessonData,
            slideVideoUrls: {
              ...(prev.lessonData.slideVideoUrls ?? {}),
              [String(n.slideNumber)]: result.videoUrl,
            },
            narration: prev.lessonData.narration.map((entry) =>
              entry.slideNumber === n.slideNumber
                ? {
                    ...entry,
                    script: result.scriptUsed,
                    estimatedDurationSeconds: Math.max(
                      1,
                      Math.round(result.durationInSeconds)
                    ),
                  }
                : entry
            ),
          },
        };
        saveLessonRecord(updated);
        void upsertMysqlLesson(updated);
        return updated;
      });
    }

    setBatchRunning(false);
    setBatchLabel("All slide videos finished.");
    setTimeout(() => setBatchLabel(null), 6000);
  };

  const hasAnyScript = narr.some((n) => n.script.trim());

  if (!narr.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Narration was disabled for this lesson, so there are no subtitle scripts
          for video.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Generate slide videos</CardTitle>
          <CardDescription>
            One pass: ElevenLabs audio and Remotion video for each slide that has
            subtitle script below. This can take several minutes locally.
            {narr.some((e) => {
              const s = slides.find((x) => x.slideNumber === e.slideNumber);
              return s != null && isGraphVisual(s.visual ?? null);
            }) ? (
              <span className="mt-2 block text-amber-800 dark:text-amber-200">
                Slides with a <strong>graph</strong> use each step&apos;s built-in
                narration for the voiceover and on-screen text so the tutor matches
                the animation — not only the script field below.
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button
            type="button"
            size="sm"
            className="gap-1 self-start"
            disabled={batchRunning || !hasAnyScript}
            onClick={() => void generateAllSlideVideos()}
          >
            {batchRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate all slide videos
          </Button>
          {batchLabel ? (
            <p className="text-sm text-muted-foreground">{batchLabel}</p>
          ) : null}
        </CardContent>
      </Card>

      {narr.map((n) => {
        const v = videoBySlide[n.slideNumber] ?? { status: "idle" as const };
        return (
          <Card key={n.slideNumber}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Slide {n.slideNumber}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={() => speak(n.slideNumber, n.script)}
                    disabled={playing === n.slideNumber}
                  >
                    <Volume2 className="h-4 w-4" />
                    Play narration preview
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={stop}>
                    <Square className="h-4 w-4" />
                    Stop audio
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ~{n.estimatedDurationSeconds}s estimated
              </p>
              {v.status !== "idle" ? (
                <p className="text-xs text-muted-foreground">
                  {v.status === "audio" && "Generating audio…"}
                  {v.status === "video" && "Rendering video…"}
                  {v.status === "done" && "Done!"}
                  {v.status === "error" && (
                    <span className="text-destructive">{v.message}</span>
                  )}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {v.status === "done" ? (
                <div className="space-y-2">
                  <video
                    controls
                    src={v.videoUrl}
                    className="w-full rounded-lg border"
                  />
                  <a
                    href={v.videoUrl}
                    download
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Download MP4
                  </a>
                </div>
              ) : null}

              <details className="group overflow-hidden rounded-lg border border-border bg-muted/25 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                  <span>Subtitles / script · tap to edit</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border bg-background px-3 py-3">
                  <Textarea
                    rows={5}
                    value={n.script}
                    onChange={(e) => updateScript(n.slideNumber, e.target.value)}
                    className="resize-y"
                  />
                </div>
              </details>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Preview uses your browser&apos;s Speech Synthesis API (no API key). Video
        uses ElevenLabs + local Remotion; long renders often time out on serverless
        hosts.
      </p>
    </div>
  );
}

function PracticeSection({ lesson }: { lesson: LessonRecord }) {
  const qs = lesson.lessonData.practiceQuestions;
  if (!qs.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Practice questions were disabled for this lesson.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {qs.map((q) => (
        <QuestionCard key={q.id} question={q} lesson={lesson} />
      ))}
    </div>
  );
}

function QuestionCard({
  question,
  lesson,
}: {
  question: PracticeQuestion;
  lesson: LessonRecord;
}) {
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    conceptToReview?: string;
    simplerExplanation?: string;
  } | null>(null);
  const [explainExtra, setExplainExtra] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    setAnswerRevealed(false);
    try {
      const payload =
        question.type === "multiple_choice"
          ? {
              question: question.question,
              correctAnswer: question.correctAnswer,
              studentAnswer: choice ?? "",
              lessonContext: lesson.lessonData.overview.summary,
              type: "multiple_choice",
            }
          : {
              question: question.question,
              correctAnswer: question.correctAnswer,
              studentAnswer: answer,
              lessonContext: JSON.stringify({
                summary: lesson.lessonData.overview.summary,
                objectives: lesson.lessonData.overview.learningObjectives,
              }),
              type: "short_answer",
            };

      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          isCorrect: false,
          feedback: data.error ?? "Could not evaluate.",
        });
        return;
      }
      setResult({
        isCorrect: data.isCorrect,
        feedback: data.feedback,
        conceptToReview: data.conceptToReview,
        simplerExplanation: data.simplerExplanation,
      });
    } finally {
      setLoading(false);
    }
  };

  const explainAgain = async () => {
    setExplainLoading(true);
    setExplainExtra(null);
    try {
      const res = await fetch("/api/explain-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept:
            result?.conceptToReview ??
            question.explanation.slice(0, 200),
          lessonContext: lesson.lessonData.overview.summary,
        }),
      });
      const data = await res.json();
      if (res.ok) setExplainExtra(data.explanation);
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={question.type === "multiple_choice" ? "default" : "secondary"}>
            {question.type === "multiple_choice" ? "Multiple choice" : "Short answer"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Ties to slide {question.relatedSlideNumber}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.type === "multiple_choice" && question.choices ? (
          <div className="space-y-2">
            {question.choices.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted/50"
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={choice === c}
                  onChange={() => setChoice(c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        ) : (
          <Textarea
            rows={4}
            placeholder="Type your answer…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        <Button
          type="button"
          onClick={submit}
          disabled={
            loading ||
            (question.type === "multiple_choice" ? !choice : !answer.trim())
          }
        >
          {loading ? "Evaluating…" : "Check answer"}
        </Button>

        {result ? (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              result.isCorrect
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            )}
          >
            <p className="font-medium">
              {result.isCorrect ? "Nice work." : "Keep going."}
            </p>
            <p className="mt-1">{result.feedback}</p>
            {result.isCorrect ? (
              question.explanation ? (
                <p className="mt-2 text-muted-foreground">{question.explanation}</p>
              ) : null
            ) : answerRevealed ? (
              <div className="mt-3 space-y-2 border-t border-amber-300/50 pt-3">
                <p className="font-medium text-amber-950">
                  Correct answer:{" "}
                  <span className="font-normal">{question.correctAnswer}</span>
                </p>
                {question.explanation ? (
                  <p className="text-muted-foreground">{question.explanation}</p>
                ) : null}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setAnswerRevealed(true)}
              >
                Show answer
              </Button>
            )}
            {result.conceptToReview ? (
              <p className="mt-2 text-xs">
                <span className="font-medium">Review:</span> {result.conceptToReview}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-1"
              onClick={explainAgain}
              disabled={explainLoading}
            >
              <Sparkles className="h-3 w-3" />
              Explain this again
            </Button>
            {explainExtra ? (
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-background/80 p-3 text-foreground">
                {explainExtra}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SourcesSection({ lesson }: { lesson: LessonRecord }) {
  const used = new Set(lesson.lessonData.sourcesUsed);
  if (!lesson.sources.length) {
    return (
      <Card>
        <CardContent className="py-8 text-muted-foreground">
          No web sources — this lesson used your uploaded or pasted notes only.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {lesson.sources.map((s, i) => (
        <SourceRow
          key={s.id}
          source={s}
          citation={i + 1}
          included={used.has(s.id)}
        />
      ))}
    </div>
  );
}

function SourceRow({
  source,
  citation,
  included,
}: {
  source: RetrievedSource;
  citation: number;
  included: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              [{citation}]
            </Badge>
            <Badge>{source.type}</Badge>
            {included ? (
              <Badge variant="default">Used in lesson</Badge>
            ) : (
              <Badge variant="secondary">Not cited</Badge>
            )}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            {source.title}
          </a>
          <p className="text-sm text-muted-foreground">{source.snippet}</p>
          <p className="text-xs text-muted-foreground">{source.domain}</p>
          {source.publishedAt ? (
            <p className="text-xs text-muted-foreground">
              Published: {new Date(source.publishedAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ExportDropdown({ lesson }: { lesson: LessonRecord }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const copyFull = async () => {
    await navigator.clipboard.writeText(lessonToMarkdown(lesson));
    setOpen(false);
  };

  const dlFull = () => {
    downloadTextFile(
      `${sanitizeFilename(lesson.lessonData.lessonTitle)}.md`,
      lessonToMarkdown(lesson)
    );
    setOpen(false);
  };

  const dlSlides = () => {
    downloadTextFile(
      `${sanitizeFilename(lesson.lessonData.lessonTitle)}-slides.md`,
      slidesMarkdown(lesson)
    );
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={copyFull}
          >
            Copy full lesson (Markdown)
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={dlFull}
          >
            Download lesson .md
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={dlSlides}
          >
            Download slides .md
          </button>
        </div>
      ) : null}
    </div>
  );
}

function sanitizeFilename(s: string) {
  return s.replace(/[^\w\d\-]+/g, "-").slice(0, 80) || "lesson";
}
