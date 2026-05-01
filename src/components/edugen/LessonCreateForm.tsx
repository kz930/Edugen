"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CourseLevel,
  ExplanationStyle,
  LearningGoal,
  LessonRecord,
  OutputOptions,
  RetrievedSource,
  Subject,
} from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SourceResultCard } from "@/components/edugen/SourceResultCard";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { saveLessonRecord } from "@/lib/storage";
import { upsertMysqlLesson } from "@/lib/mysql-lessons-client";
import { ChevronRight, Sparkles } from "lucide-react";

const SUBJECTS: Subject[] = [
  "Computer Science",
  "Biology",
  "Chemistry",
  "Psychology",
  "Math",
  "Economics",
  "History",
  "Other",
];

const LEVELS: CourseLevel[] = [
  "Middle School",
  "High School",
  "AP/Honors",
  "College Intro",
  "College Advanced",
];

const GOALS: LearningGoal[] = [
  "Explain from scratch",
  "Study for an exam",
  "Help with homework",
  "Make it visual",
  "Quick review",
];

const STYLES: ExplanationStyle[] = [
  "Simple and friendly",
  "Step-by-step",
  "Visual analogy",
  "Formal academic",
  "Exam-focused",
];

const EXAMPLES = [
  "Recursion in Python",
  "Classical vs. operant conditioning",
  "Cellular respiration",
  "Derivatives in calculus",
  "Supply and demand",
];

export function LessonCreateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<Subject>("Computer Science");
  const [level, setLevel] = useState<CourseLevel>("High School");
  const [learningGoal, setLearningGoal] = useState<LearningGoal>(
    "Explain from scratch"
  );
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>(
    "Simple and friendly"
  );
  const [outputOptions, setOutputOptions] = useState<OutputOptions>({
    slides: true,
    narration: true,
    practice: true,
    summary: true,
  });
  const [searchOnline, setSearchOnline] = useState(true);
  const [maxSources, setMaxSources] = useState<3 | 5 | 8>(5);
  const [pastedNotes, setPastedNotes] = useState("");
  const [uploadedText, setUploadedText] = useState("");

  const [sources, setSources] = useState<RetrievedSource[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fetchLoading, setFetchLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sourcesFetched, setSourcesFetched] = useState(false);

  const combinedNotes = useMemo(
    () => [pastedNotes, uploadedText].filter(Boolean).join("\n\n---\n\n"),
    [pastedNotes, uploadedText]
  );

  const toggleSource = useCallback((id: string, v: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFetchError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/extract-upload-text", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setFetchError(data.error ?? "Could not read file.");
      return;
    }
    setUploadedText(data.text ?? "");
  };

  const fetchResources = async () => {
    setFetchError(null);
    if (!topic.trim()) {
      setFetchError("Please enter a topic or question.");
      return;
    }
    setFetchLoading(true);
    setSourcesFetched(false);
    try {
      const res = await fetch("/api/search-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          level,
          maxSources,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Search failed.");
        setSources([]);
        setSelectedIds(new Set());
        return;
      }
      const list = data.sources as RetrievedSource[];
      setSources(list);
      const defaultSel = new Set(
        list.filter((s) => s.includedDefault).map((s) => s.id)
      );
      setSelectedIds(defaultSel.size ? defaultSel : new Set(list.map((s) => s.id)));
      setSourcesFetched(true);
    } catch {
      setFetchError("Network error while searching.");
    } finally {
      setFetchLoading(false);
    }
  };

  const selectedSources = useMemo(() => {
    return sources.filter((s) => selectedIds.has(s.id));
  }, [sources, selectedIds]);

  const canGenerate = useMemo(() => {
    if (!topic.trim()) return false;
    const outOk =
      outputOptions.slides ||
      outputOptions.narration ||
      outputOptions.practice ||
      outputOptions.summary;
    if (!outOk) return false;

    if (searchOnline) {
      return sourcesFetched && selectedSources.length > 0;
    }
    return combinedNotes.trim().length >= 20;
  }, [
    topic,
    outputOptions,
    searchOnline,
    sourcesFetched,
    selectedSources.length,
    combinedNotes,
  ]);

  const generateLesson = async () => {
    setGenerateError(null);
    if (!canGenerate) return;
    setGenerateLoading(true);
    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          level,
          learningGoal,
          explanationStyle,
          selectedSources: searchOnline ? selectedSources : [],
          uploadedText: combinedNotes,
          outputOptions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Generation failed.");
        return;
      }
      const lessonData = data.lesson;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `lesson-${Date.now()}`;
      const record: LessonRecord = {
        id,
        createdAt: new Date().toISOString(),
        topic: topic.trim(),
        subject,
        level,
        learningGoal,
        explanationStyle,
        sources: searchOnline ? sources : [],
        uploadedText: combinedNotes,
        lessonData,
        selectedSourceIds: searchOnline ? selectedSources.map((s) => s.id) : [],
      };
      saveLessonRecord(record);
      const mysql = await upsertMysqlLesson(record);
      if (mysql.enabled && !mysql.ok) {
        setGenerateError(
          mysql.error ?? "Could not save the lesson to MySQL. Check your database and table."
        );
        return;
      }
      router.push(`/lesson/${id}`);
    } catch {
      setGenerateError("Network error during generation.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const citationIndex = useCallback(
    (id: string) => sources.findIndex((s) => s.id === id) + 1,
    [sources]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      {/* Progress */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <Step n={1} label="Topic" active />
        <ChevronRight className="h-4 w-4 hidden sm:block" />
        <Step n={2} label="Sources" active={sourcesFetched || !searchOnline} />
        <ChevronRight className="h-4 w-4 hidden sm:block" />
        <Step n={3} label="Generate" />
        <ChevronRight className="h-4 w-4 hidden sm:block" />
        <Step n={4} label="Study" />
      </div>

      <Card className="border-border/80 shadow-md">
        <CardHeader>
          <CardTitle>What are you stuck on?</CardTitle>
          <CardDescription>
            Describe your confusion. Edugen will pull real educational sources
            (when enabled) and build a micro-lesson grounded in those snippets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or question</Label>
            <Input
              id="topic"
              placeholder={"Example: I don't understand recursion in Python"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTopic(ex)}
                  className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Course level">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
              >
                {LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Learning goal">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value as LearningGoal)}
              >
                {GOALS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Explanation style">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={explanationStyle}
                onChange={(e) =>
                  setExplanationStyle(e.target.value as ExplanationStyle)
                }
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium">Output options</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Opt
                id="out-slides"
                checked={outputOptions.slides}
                onChange={(v) =>
                  setOutputOptions((o) => ({ ...o, slides: v }))
                }
                label="Slides"
              />
              <Opt
                id="out-narration"
                checked={outputOptions.narration}
                onChange={(v) =>
                  setOutputOptions((o) => ({ ...o, narration: v }))
                }
                label="Narration script"
              />
              <Opt
                id="out-practice"
                checked={outputOptions.practice}
                onChange={(v) =>
                  setOutputOptions((o) => ({ ...o, practice: v }))
                }
                label="Practice questions"
              />
              <Opt
                id="out-summary"
                checked={outputOptions.summary}
                onChange={(v) =>
                  setOutputOptions((o) => ({ ...o, summary: v }))
                }
                label="Study summary"
              />
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium">Resource options</p>
            <div className="space-y-3">
              <Opt
                id="res-search"
                checked={searchOnline}
                onChange={(v) => {
                  setSearchOnline(v);
                  if (!v) {
                    setSources([]);
                    setSourcesFetched(false);
                    setSelectedIds(new Set());
                  }
                }}
                label="Search trusted online resources (Tavily)"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of sources (web search)">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                value={maxSources}
                disabled={!searchOnline}
                onChange={(e) =>
                  setMaxSources(Number(e.target.value) as 3 | 5 | 8)
                }
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={8}>8</option>
              </select>
            </Field>
            <Field label="Upload notes (.txt, .md, .pdf)">
              <Input
                type="file"
                accept=".txt,.md,.pdf,text/plain"
                disabled={false}
                onChange={handleFile}
              />
              {uploadedText ? (
                <p className="text-xs text-muted-foreground">
                  Loaded {uploadedText.length} characters from file.
                </p>
              ) : null}
            </Field>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Paste class notes (optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Paste bullet points, definitions, or snippets from your lecture…"
              value={pastedNotes}
              onChange={(e) => setPastedNotes(e.target.value)}
            />
            {!searchOnline && combinedNotes.trim().length < 20 ? (
              <p className="text-xs text-amber-800">
                With online search off, add at least a short paragraph of notes
                (20+ characters) so the lesson has real grounding.
              </p>
            ) : null}
          </div>

          {fetchError ? <ErrorState title={fetchError} /> : null}

          {searchOnline ? (
            <>
              {fetchLoading ? (
                <LoadingState
                  title="Finding real educational resources…"
                  description="Calling your configured search API (e.g. Tavily)."
                />
              ) : null}

              <Button
                type="button"
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={fetchResources}
                disabled={fetchLoading}
              >
                Fetch Resources
              </Button>

              {sourcesFetched && sources.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Select sources to ground the lesson ({selectedSources.length}{" "}
                    selected)
                  </p>
                  {sources.map((s) => (
                    <SourceResultCard
                      key={s.id}
                      source={s}
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={(v) => toggleSource(s.id, v)}
                      citationNumber={citationIndex(s.id)}
                    />
                  ))}
                </div>
              ) : null}

              {sourcesFetched && sources.length === 0 ? (
                <ErrorState title="No sources returned. Try again or adjust your topic." />
              ) : null}
            </>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Online search is off. Ground your lesson with pasted notes or an
              uploaded file before generating.
            </p>
          )}

          <Separator />

          {generateError ? <ErrorState title={generateError} /> : null}

          <Button
            type="button"
            size="lg"
            className="gap-2"
            onClick={generateLesson}
            disabled={!canGenerate || generateLoading}
          >
            {generateLoading ? (
              <>Generating…</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Micro-Lesson
              </>
            )}
          </Button>
          {!canGenerate && !generateLoading ? (
            <p className="text-xs text-muted-foreground">
              {searchOnline
                ? "Fetch resources and keep at least one source selected, or turn off online search and add notes."
                : "Add enough pasted/uploaded notes (20+ characters)."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Edugen is a study support tool. It may make mistakes. Always verify
        important information with your instructor, textbook, or cited sources.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Opt({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <Label htmlFor={id} className="font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

function Step({
  n,
  label,
  active,
}: {
  n: number;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
        active
          ? "bg-primary/15 font-medium text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold shadow-sm">
        {n}
      </span>
      {label}
    </span>
  );
}
