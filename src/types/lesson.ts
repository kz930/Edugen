/** Core Edugen data structures */

export type Subject =
  | "Computer Science"
  | "Biology"
  | "Chemistry"
  | "Psychology"
  | "Math"
  | "Economics"
  | "History"
  | "Other";

export type CourseLevel =
  | "Middle School"
  | "High School"
  | "AP/Honors"
  | "College Intro"
  | "College Advanced";

export type LearningGoal =
  | "Explain from scratch"
  | "Study for an exam"
  | "Help with homework"
  | "Make it visual"
  | "Quick review";

export type ExplanationStyle =
  | "Simple and friendly"
  | "Step-by-step"
  | "Visual analogy"
  | "Formal academic"
  | "Exam-focused";

export type SourceType =
  | "article"
  | "documentation"
  | "video"
  | "academic"
  | "unknown";

export interface RetrievedSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  type: SourceType;
  sourceRank: number;
  includedDefault: boolean;
  /** ISO date when known */
  publishedAt?: string;
  thumbnailUrl?: string;
  channelTitle?: string;
}

export interface LessonOverview {
  summary: string;
  learningObjectives: string[];
  estimatedTimeMinutes: number;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface LessonBlueprint {
  prerequisites: string[];
  keyTerms: KeyTerm[];
  conceptPath: string[];
  commonMistakes: string[];
  recap: string[];
  /** Extended blueprint sections */
  coreConcept?: string;
  examplePlan?: string[];
  practiceGoals?: string[];
}

import type { VisualSlide } from "./visual-slide";

export type SlideContentKind = "bullets" | "code" | "diagram" | "mixed";

export interface SlideContent {
  slideNumber: number;
  title: string;
  mainIdea: string;
  bullets: string[];
  visualSuggestion: string;
  /** Optional alias used only in UI / manual data; generation uses `visualSuggestion`. */
  visualIdea?: string;
  /** Literal source code for the slide (not a prose description). Prefer this over fenced prose in `visualSuggestion`. */
  codeSnippet?: string;
  /** Optional hint from generation; invalid code degrades to bullets during sanitization. */
  contentType?: SlideContentKind;
  /**
   * Structured visual storyboard (graph algorithm steps, diagram placeholder, equation).
   * When present and valid, the slide viewer prioritizes this over static diagrams.
   */
  visual?: VisualSlide | null;
  speakerNotes: string;
  sourceIds: string[];
}

export interface NarrationEntry {
  slideNumber: number;
  script: string;
  estimatedDurationSeconds: number;
}

export type QuestionType = "multiple_choice" | "short_answer";

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
  relatedSlideNumber: number;
}

export interface GeneratedLessonData {
  lessonTitle: string;
  overview: LessonOverview;
  blueprint: LessonBlueprint;
  slides: SlideContent[];
  narration: NarrationEntry[];
  practiceQuestions: PracticeQuestion[];
  sourcesUsed: string[];
  /**
   * Slide number (string key) → `/generated/video-{n}.mp4` after successful render.
   * Persisted so the Video tab remembers clips after reload.
   */
  slideVideoUrls?: Record<string, string>;
}

export interface LessonRecord {
  id: string;
  createdAt: string;
  topic: string;
  subject: Subject;
  level: CourseLevel;
  learningGoal: LearningGoal;
  explanationStyle: ExplanationStyle;
  sources: RetrievedSource[];
  uploadedText: string;
  lessonData: GeneratedLessonData;
  /** IDs of sources actually selected for generation */
  selectedSourceIds: string[];
}

export interface OutputOptions {
  slides: boolean;
  narration: boolean;
  practice: boolean;
  summary: boolean;
}
