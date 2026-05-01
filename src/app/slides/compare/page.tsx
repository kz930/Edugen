"use client";

import { Player } from "@remotion/player";
import { SlidePreviewCard } from "@/components/lesson/SlidePreviewCard";
import { buildDiagramPlan, visualPlanToRemotionDiagram } from "@/lib/slide-mermaid";
import type { LessonRecord, SlideContent, Subject } from "@/types/lesson";
import { SlideVideo } from "../../../../remotion/SlideVideo";

const DEMO_SLIDE: SlideContent = {
  slideNumber: 1,
  title: "Introduction to Recursion",
  mainIdea:
    "Recursion solves problems by breaking them into smaller copies of the same problem.",
  bullets: [
    "Base case stops the recursion.",
    "Recursive step moves toward the base case.",
    "Stack frames track each call.",
  ],
  visualSuggestion: "",
  speakerNotes: "",
  sourceIds: [],
};

const DEMO_LESSON = {
  id: "compare-demo",
  createdAt: new Date().toISOString(),
  topic: "Compare",
  subject: "Computer Science" as Subject,
  level: "College Intro",
  learningGoal: "Explain from scratch",
  explanationStyle: "Simple and friendly",
  sources: [],
  uploadedText: "",
  selectedSourceIds: [],
  lessonData: {
    lessonTitle: "Compare",
    overview: {
      summary: "",
      learningObjectives: [],
      estimatedTimeMinutes: 10,
    },
    blueprint: {
      prerequisites: [],
      keyTerms: [],
      conceptPath: [],
      commonMistakes: [],
      recap: [],
    },
    slides: [DEMO_SLIDE],
    narration: [
      {
        slideNumber: 1,
        script: "Recursion is elegant. It needs a base case.",
        estimatedDurationSeconds: 10,
      },
    ],
    practiceQuestions: [],
    sourcesUsed: [],
  },
} satisfies LessonRecord;

const DEMO_SCRIPT = DEMO_LESSON.lessonData.narration[0]!.script;
const DIAGRAM_PLAN = visualPlanToRemotionDiagram(buildDiagramPlan(DEMO_SLIDE));

export default function SlideComparePage() {
  const inputProps = {
    title: DEMO_SLIDE.title,
    bullets: DEMO_SLIDE.bullets,
    audioHttpUrl: "",
    durationInSeconds: 10,
    narrationScript: DEMO_SCRIPT,
    diagramPlan: DIAGRAM_PLAN,
    themeName: "cs" as const,
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-lg font-semibold text-[#0F172A]">
          Slide preview vs Remotion video (unification check)
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Both use <code className="rounded bg-white px-1">themeTokens.cs</code> at 640×360
          (half of 1280×720).
        </p>

        <div className="mt-8 flex flex-col flex-wrap items-start justify-center gap-10 lg:flex-row">
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#64748B]">
              Editor — SlidePreviewCard
            </p>
            <div
              className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm"
              style={{ width: 640, height: 360 }}
            >
              <div
                className="origin-top-left"
                style={{
                  width: 1280,
                  height: 720,
                  transform: "scale(0.5)",
                }}
              >
                <SlidePreviewCard
                  slide={DEMO_SLIDE}
                  slideIndex={0}
                  totalSlides={1}
                  editing={false}
                  lesson={DEMO_LESSON}
                  onUpdate={() => {}}
                  previewThemeId="cs"
                  narrationScript={DEMO_SCRIPT}
                />
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#64748B]">
              Remotion — SlideVideo (frame 0)
            </p>
            <div
              className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-black shadow-sm"
              style={{ width: 640, height: 360 }}
            >
              <Player
                component={SlideVideo}
                durationInFrames={300}
                compositionWidth={1280}
                compositionHeight={720}
                fps={30}
                inputProps={inputProps}
                controls={false}
                loop={false}
                clickToPlay={false}
                doubleClickToFullscreen={false}
                spaceKeyToPlayOrPause={false}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
