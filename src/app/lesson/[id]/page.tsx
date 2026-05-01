"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMysqlLessonById } from "@/lib/mysql-lessons-client";
import { getLessonById, saveLessonRecord } from "@/lib/storage";
import type { LessonRecord } from "@/types/lesson";

export default function LessonPage() {
  const params = useParams();
  const id = params.id as string;
  const [lesson, setLesson] = useState<LessonRecord | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLesson(undefined);

    (async () => {
      const remote = await fetchMysqlLessonById(id);
      if (cancelled) return;
      if (remote.enabled && remote.lesson) {
        saveLessonRecord(remote.lesson);
        setLesson(remote.lesson);
        return;
      }
      const local = getLessonById(id);
      setLesson(local ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (lesson === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (lesson === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Lesson not found</h1>
        <p className="mt-2 text-muted-foreground">
          This lesson isn&apos;t in MySQL for this browser (or in local storage). It may
          have been deleted, or you&apos;re on a different device without the same
          lesson id.
        </p>
        <Link href="/create" className="mt-8 inline-block">
          <Button>Create a new lesson</Button>
        </Link>
      </div>
    );
  }

  return <LessonWorkspace initial={lesson} />;
}
