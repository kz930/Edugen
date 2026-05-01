"use client";

import type {
  GeneratedLessonData,
  LessonRecord,
  PracticeQuestion,
  RetrievedSource,
  SlideContent,
} from "@/types/lesson";
import { SlidePreviewCard } from "@/components/lesson/SlidePreviewCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  Save,
  Sparkles,
  Loader2,
  Volume2,
  Square,
} from "lucide-react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Section =
  | "overview"
  | "blueprint"
  | "slides"
  | "video"
  | "practice"
  | "sources";

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "blueprint", label: "Learning blueprint" },
  { id: "slides", label: "Slides" },
  { id: "video", label: "Video" },
  { id: "practice", label: "Practice" },
  { id: "sources", label: "Sources" },
];

export function LessonWorkspace({ initial }: { initial: LessonRecord }) {
  const [lesson, setLesson] = useState<LessonRecord>(initial);
  const [section, setSection] = useState<Section>("overview");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable"
  );

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

  useEffect(() => {
    setLesson(initial);
  }, [initial]);

  const d = lesson.lessonData;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30">
      <div className="border-b border-border bg-background px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </span>
              Edugen
            </Link>
            <span className="hidden text-muted-foreground md:inline">|</span>
            <h1 className="truncate text-base font-semibold md:text-lg">
              {d.lessonTitle}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/create">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Create
              </Button>
            </Link>
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
        </div>
        {saveMsg ? (
          <p className="mx-auto mt-2 max-w-7xl text-xs text-muted-foreground">
            {saveMsg}
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr_260px] md:px-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-xl border border-border bg-card p-2 shadow-sm">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSection(n.id)}
                className={cn(
                  "flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  section === n.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile section tabs */}
        <div className="lg:hidden">
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={section}
            onChange={(e) => setSection(e.target.value as Section)}
          >
            {NAV.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        {/* Main */}
        <main
          className={cn(
            "min-h-[480px] space-y-6",
            density === "compact" && "text-sm"
          )}
        >
          {section === "overview" ? (
            <OverviewSection lesson={lesson} />
          ) : null}
          {section === "blueprint" ? (
            <BlueprintSection data={d} />
          ) : null}
          {section === "slides" ? (
            <SlidesSection lesson={lesson} setLesson={setLesson} />
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

          <p className="text-xs text-muted-foreground">
            Edugen is a study support tool. It may make mistakes. Always verify
            important information with your instructor, textbook, or cited
            sources.
          </p>
        </main>

        {/* Right */}
        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lesson settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Reading density</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={density}
                  onChange={(e) =>
                    setDensity(e.target.value as "comfortable" | "compact")
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Use{" "}
                <strong className="text-foreground">Regenerate slide</strong>{" "}
                on each card for deeper adjustments (requires OpenAI).
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sources in lesson</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lesson.sources.length === 0 ? (
                <p className="text-muted-foreground">
                  This lesson was generated from your notes only.
                </p>
              ) : (
                lesson.sources.slice(0, 6).map((s) => (
                  <div key={s.id} className="truncate text-xs">
                    <Badge variant="outline" className="mr-1">
                      {s.type}
                    </Badge>
                    <span>{s.domain}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
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

function SlidesSection({
  lesson,
  setLesson,
}: {
  lesson: LessonRecord;
  setLesson: Dispatch<SetStateAction<LessonRecord>>;
}) {
  const slides = lesson.lessonData.slides;
  const [idx, setIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const slide = slides[idx];

  const updateSlide = useCallback(
    (patch: Partial<SlideContent>) => {
      setLesson((prev) => {
        const nextSlides = prev.lessonData.slides.map((s) =>
          s.slideNumber === slide.slideNumber ? { ...s, ...patch } : s
        );
        return {
          ...prev,
          lessonData: { ...prev.lessonData, slides: nextSlides },
        };
      });
    },
    [setLesson, slide?.slideNumber]
  );

  const regenerate = async () => {
    if (!slide) return;
    setRegenLoading(true);
    try {
      const res = await fetch("/api/regenerate-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideNumber: slide.slideNumber,
          topic: lesson.topic,
          lessonTitle: lesson.lessonData.lessonTitle,
          selectedSources: lesson.sources.filter((s) =>
            lesson.lessonData.sourcesUsed.includes(s.id)
          ),
          uploadedText: lesson.uploadedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
    }
  };

  const copySlide = async () => {
    if (!slide) return;
    const text = `${slide.title}\n\n${slide.mainIdea}\n\n${slide.bullets.map((b) => `- ${b}`).join("\n")}`;
    await navigator.clipboard.writeText(text);
  };

  if (!slides.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Slides were disabled for this generation.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={idx <= 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Slide {idx + 1} / {slides.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={idx >= slides.length - 1}
            onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Done editing" : "Edit slide"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={regenerate}
            disabled={regenLoading}
          >
            <RefreshCw className={cn("h-4 w-4", regenLoading && "animate-spin")} />
            Regenerate slide
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={copySlide}>
            <Copy className="h-4 w-4" />
            Copy slide
          </Button>
        </div>
      </div>

      {slide ? (
        <SlidePreviewCard
          slide={slide}
          slideIndex={idx}
          totalSlides={slides.length}
          editing={editing}
          lesson={lesson}
          onUpdate={updateSlide}
        />
      ) : null}
    </div>
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
  script: string,
  slide: SlideContent,
  onPhase: (phase: "audio" | "video") => void
): Promise<{ ok: true; videoUrl: string } | { ok: false; message: string }> {
  try {
    onPhase("audio");
    const audioRes = await fetch("/api/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: script, slideIndex: slideNumber }),
    });
    const audioData = await audioRes.json();
    if (!audioRes.ok) {
      throw new Error(audioData.error ?? "Audio generation failed");
    }
    const { audioUrl, durationInSeconds } = audioData as {
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
        audioUrl,
        durationInSeconds:
          typeof durationInSeconds === "number" && durationInSeconds > 0
            ? durationInSeconds
            : 10,
        narrationScript: script,
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
    const { videoUrl } = renderData as { videoUrl: string };
    return { ok: true, videoUrl };
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
  const narr = lesson.lessonData.narration;
  const slides = lesson.lessonData.slides;
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const [playing, setPlaying] = useState<number | null>(null);
  const [videoBySlide, setVideoBySlide] = useState<Record<number, VideoGenState>>(
    {}
  );
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
        n.script,
        slide,
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

  const submit = async () => {
    setLoading(true);
    setResult(null);
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
            {question.explanation ? (
              <p className="mt-2 text-muted-foreground">{question.explanation}</p>
            ) : null}
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
