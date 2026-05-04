"use client";

import { useState } from "react";
import { SlidePreviewCard } from "@/components/lesson/SlidePreviewCard";
import {
  createBfsDemoLessonRecord,
  createDfsDemoLessonRecord,
} from "@/data/sample-graph-storyboard";
import { Button } from "@/components/ui/button";

export default function VisualStoryboardDemoPage() {
  const [tab, setTab] = useState<"bfs" | "dfs">("bfs");
  const lesson =
    tab === "bfs" ? createBfsDemoLessonRecord() : createDfsDemoLessonRecord();
  const slide = lesson.lessonData.slides[0]!;
  const script = lesson.lessonData.narration[0]!.script;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Visual storyboard demo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Interactive BFS / DFS with Cytoscape.js: step subtitles, queue or stack state,
            and playback controls. Generated lessons can include the same{" "}
            <code className="rounded bg-white px-1">visual</code> field on slides.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "bfs" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("bfs")}
          >
            BFS (queue)
          </Button>
          <Button
            type="button"
            variant={tab === "dfs" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("dfs")}
          >
            DFS (stack)
          </Button>
        </div>

        <SlidePreviewCard
          slide={slide}
          slideIndex={0}
          totalSlides={1}
          editing={false}
          lesson={lesson}
          onUpdate={() => {}}
          previewThemeId="cs"
          narrationScript={script}
        />
      </div>
    </div>
  );
}
