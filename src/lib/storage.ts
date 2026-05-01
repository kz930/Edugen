const STORAGE_KEY = "edugen-lessons-v1";

import type { LessonRecord } from "@/types/lesson";

export function loadLessons(): LessonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LessonRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLessonRecord(lesson: LessonRecord): void {
  const list = loadLessons();
  const idx = list.findIndex((l) => l.id === lesson.id);
  if (idx >= 0) list[idx] = lesson;
  else list.unshift(lesson);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getLessonById(id: string): LessonRecord | undefined {
  return loadLessons().find((l) => l.id === id);
}

export function deleteLesson(id: string): void {
  const list = loadLessons().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Merge server (MySQL) list with local-only rows, then write cache (newest first). */
export function mergeRemoteLessons(remote: LessonRecord[]): void {
  if (typeof window === "undefined") return;
  const local = loadLessons();
  const byId = new Map<string, LessonRecord>();
  for (const r of remote) {
    byId.set(r.id, r);
  }
  for (const l of local) {
    if (!byId.has(l.id)) {
      byId.set(l.id, l);
    }
  }
  const merged = Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* quota */
  }
}
