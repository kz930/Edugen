"use client";

import Link from "next/link";
import { Trash2, ExternalLink } from "lucide-react";
import type { LessonRecord } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteLesson } from "@/lib/storage";
import { deleteMysqlLesson } from "@/lib/mysql-lessons-client";

export function SavedLessonCard({ lesson, onDeleted }: { lesson: LessonRecord; onDeleted: () => void }) {
  const created = new Date(lesson.createdAt).toLocaleString();
  const slideCount = lesson.lessonData.slides.length;
  const sourceCount = lesson.sources.length;

  const remove = async () => {
    await deleteMysqlLesson(lesson.id);
    deleteLesson(lesson.id);
    onDeleted();
  };

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{lesson.subject}</Badge>
            <Badge variant="outline">{lesson.level}</Badge>
          </div>
          <h2 className="truncate text-lg font-semibold text-foreground">
            {lesson.lessonData.lessonTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {created} · {sourceCount} sources · {slideCount} slides
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/lesson/${lesson.id}`}>
            <Button size="sm" className="gap-1">
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button type="button" size="sm" variant="outline" onClick={remove} className="gap-1 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
