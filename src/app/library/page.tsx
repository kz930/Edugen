"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SavedLessonCard } from "@/components/library/SavedLessonCard";
import { Button } from "@/components/ui/button";
import { fetchMysqlLessons } from "@/lib/mysql-lessons-client";
import { loadLessons, mergeRemoteLessons } from "@/lib/storage";
import type { LessonRecord } from "@/types/lesson";

export default function LibraryPage() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSyncNote(null);
    const remote = await fetchMysqlLessons();
    if (remote.enabled && Array.isArray(remote.lessons)) {
      mergeRemoteLessons(remote.lessons);
      if (remote.lessons.length > 0) {
        setSyncNote("Merged lessons from MySQL with your local cache.");
      }
    }
    setLessons(loadLessons());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20 px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved lessons</h1>
            <p className="mt-2 text-muted-foreground">
              Cached in this browser. With MySQL configured, lessons also sync to your database
              (scoped by anonymous device id until you add auth).
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void refresh()}>
              Refresh
            </Button>
            <Link href="/create">
              <Button>New lesson</Button>
            </Link>
          </div>
        </div>

        {syncNote ? (
          <p className="mb-4 text-xs text-muted-foreground">{syncNote}</p>
        ) : null}

        {lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">
              No lessons saved yet. Create one and it will appear here automatically.
            </p>
            <Link href="/create" className="mt-6 inline-block">
              <Button>Create a micro-lesson</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {lessons.map((l) => (
              <li key={l.id}>
                <SavedLessonCard lesson={l} onDeleted={() => void refresh()} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
