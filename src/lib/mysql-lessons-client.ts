import type { LessonRecord } from "@/types/lesson";
import { getOrCreateDeviceId } from "@/lib/device-id";

const DEVICE_HEADER = "X-Edugen-Device-Id";

function deviceHeaders(): HeadersInit {
  const id = getOrCreateDeviceId();
  return id ? { [DEVICE_HEADER]: id } : {};
}

export type LessonsListResponse = {
  enabled: boolean;
  lessons?: LessonRecord[];
  error?: string;
};

/** List lessons for this browser from MySQL (if configured). */
export async function fetchMysqlLessons(): Promise<LessonsListResponse> {
  try {
    const res = await fetch("/api/lessons", { headers: deviceHeaders() });
    const data = (await res.json()) as LessonsListResponse;
    if (!res.ok) {
      return {
        enabled: false,
        lessons: [],
        error: data.error ?? res.statusText,
      };
    }
    return data;
  } catch {
    return { enabled: false, lessons: [], error: "Network error" };
  }
}

export async function upsertMysqlLesson(
  lesson: LessonRecord
): Promise<{ ok: boolean; enabled: boolean; error?: string }> {
  try {
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...deviceHeaders(),
      },
      body: JSON.stringify(lesson),
    });
    const data = (await res.json()) as {
      enabled?: boolean;
      ok?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        enabled: data.enabled === true,
        error: data.error ?? res.statusText,
      };
    }
    if (data.enabled === true && data.ok === false) {
      return { ok: false, enabled: true, error: data.error ?? "Save rejected." };
    }
    return {
      ok: true,
      enabled: data.enabled === true,
      error: data.error,
    };
  } catch (e) {
    return {
      ok: false,
      enabled: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function fetchMysqlLessonById(
  id: string
): Promise<{ enabled: boolean; lesson: LessonRecord | null; error?: string }> {
  try {
    const res = await fetch(`/api/lessons/${encodeURIComponent(id)}`, {
      headers: deviceHeaders(),
    });
    const data = (await res.json()) as {
      enabled?: boolean;
      lesson?: LessonRecord | null;
      error?: string;
    };
    if (!res.ok) {
      return { enabled: false, lesson: null, error: data.error };
    }
    return {
      enabled: data.enabled === true,
      lesson: data.lesson ?? null,
    };
  } catch {
    return { enabled: false, lesson: null, error: "Network error" };
  }
}

export async function deleteMysqlLesson(
  id: string
): Promise<{ ok: boolean; enabled: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/lessons/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: deviceHeaders(),
    });
    const data = (await res.json()) as {
      enabled?: boolean;
      ok?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        enabled: data.enabled === true,
        error: data.error ?? res.statusText,
      };
    }
    return { ok: data.ok !== false, enabled: data.enabled === true };
  } catch (e) {
    return {
      ok: false,
      enabled: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
