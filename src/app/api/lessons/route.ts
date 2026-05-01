import { NextResponse } from "next/server";
import type { LessonRecord } from "@/types/lesson";
import { getMysqlPool, isMysqlLessonsConfigured } from "@/lib/mysql";

export const runtime = "nodejs";

const DEVICE_HEADER = "x-edugen-device-id";

function readDeviceId(req: Request): string | null {
  const raw = req.headers.get(DEVICE_HEADER)?.trim();
  if (!raw || raw.length > 128) return null;
  if (!/^[a-zA-Z0-9-]+$/.test(raw)) return null;
  return raw;
}

function tableName(): string {
  const t = process.env.MYSQL_LESSONS_TABLE?.trim() || "edugen_lessons";
  return t.replace(/[^a-zA-Z0-9_]/g, "") || "edugen_lessons";
}

/** GET: { enabled, lessons } — enabled false when MySQL not configured. */
export async function GET(req: Request) {
  if (!isMysqlLessonsConfigured()) {
    return NextResponse.json({ enabled: false, lessons: [] as LessonRecord[] });
  }

  const deviceId = readDeviceId(req);
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing or invalid X-Edugen-Device-Id header." },
      { status: 400 }
    );
  }

  const pool = getMysqlPool();
  if (!pool) {
    return NextResponse.json({ enabled: false, lessons: [] as LessonRecord[] });
  }

  try {
    const table = tableName();
    const [rowsResult] = await pool.query(
      `SELECT id, payload FROM \`${table}\` WHERE device_id = ? ORDER BY updated_at DESC`,
      [deviceId]
    );
    const rows = rowsResult as {
      id: string;
      payload: string | Buffer | object;
    }[];

    const lessons: LessonRecord[] = [];
    for (const row of rows) {
      try {
        const rawPayload =
          typeof row.payload === "string"
            ? row.payload
            : row.payload instanceof Buffer
              ? row.payload.toString("utf-8")
              : JSON.stringify(row.payload);
        const parsed = JSON.parse(rawPayload) as LessonRecord;
        if (parsed?.id && parsed.lessonData) lessons.push(parsed);
      } catch {
        /* skip bad row */
      }
    }

    return NextResponse.json({ enabled: true, lessons });
  } catch (e) {
    console.error("MySQL GET /api/lessons:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

/** POST: upsert one lesson for this device. */
export async function POST(req: Request) {
  if (!isMysqlLessonsConfigured()) {
    return NextResponse.json({ enabled: false, ok: true });
  }

  const deviceId = readDeviceId(req);
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing or invalid X-Edugen-Device-Id header." },
      { status: 400 }
    );
  }

  let body: LessonRecord;
  try {
    body = (await req.json()) as LessonRecord;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.id || typeof body.id !== "string" || body.id.length > 128) {
    return NextResponse.json({ error: "Invalid lesson id." }, { status: 400 });
  }
  if (!body.lessonData) {
    return NextResponse.json({ error: "Invalid lesson payload." }, { status: 400 });
  }

  const pool = getMysqlPool();
  if (!pool) {
    return NextResponse.json({ enabled: false, ok: true });
  }

  const now = new Date();
  const createdAt = body.createdAt ? new Date(body.createdAt) : now;
  const payloadJson = JSON.stringify(body);
  const table = tableName();

  try {
    await pool.query(
      `INSERT INTO \`${table}\` (id, device_id, created_at, updated_at, payload)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         updated_at = VALUES(updated_at),
         payload = VALUES(payload)`,
      [body.id, deviceId, createdAt, now, payloadJson]
    );

    return NextResponse.json({ enabled: true, ok: true });
  } catch (e) {
    console.error("MySQL POST /api/lessons:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
