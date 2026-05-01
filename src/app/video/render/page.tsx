"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function RenderPageInner() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lessonId");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-xl font-semibold text-[#0F172A]">Slide videos</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
        Use the lesson editor <strong className="font-medium text-[#475569]">Video</strong>{" "}
        tab and run <strong className="font-medium text-[#475569]">Generate all slide videos</strong>{" "}
        to create narration audio and a Remotion MP4 for each slide that has a script.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" asChild>
          <Link href={lessonId ? `/lesson/${lessonId}` : "/library"}>
            Back to lesson
          </Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/library">Saved lessons</Link>
        </Button>
      </div>
    </div>
  );
}

export default function VideoRenderPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Suspense fallback={<div className="p-8 text-sm text-[#64748B]">Loading…</div>}>
        <RenderPageInner />
      </Suspense>
    </div>
  );
}
