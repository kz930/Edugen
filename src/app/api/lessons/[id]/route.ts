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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isMysqlLessonsConfigured()) {
    return NextResponse.json({ enabled: false, lesson: null });
  }

  const deviceId = readDeviceId(req);
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing or invalid X-Edugen-Device-Id header." },
      { status: 400 }
    );
  }

  const id = params.id?.trim();
  if (!id || id.length > 128) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const pool = getMysqlPool();
  if (!pool) {
    return NextResponse.json({ enabled: false, lesson: null });
  }

  try {
    const table = tableName();
    const [rowsResult] = await pool.query(
      `SELECT payload FROM \`${table}\` WHERE id = ? AND device_id = ? LIMIT 1`,
      [id, deviceId]
    );
    const rows = rowsResult as { payload: string | Buffer | object }[];
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ enabled: true, lesson: null });
    }
    const rawPayload =
      typeof row.payload === "string"
        ? row.payload
        : row.payload instanceof Buffer
          ? row.payload.toString("utf-8")
          : JSON.stringify(row.payload);
    const lesson = JSON.parse(rawPayload) as LessonRecord;
    return NextResponse.json({ enabled: true, lesson });
  } catch (e) {
    console.error("MySQL GET /api/lessons/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const id = params.id?.trim();
  if (!id || id.length > 128) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const pool = getMysqlPool();
  if (!pool) {
    return NextResponse.json({ enabled: false, ok: true });
  }

  try {
    const table = tableName();
    await pool.query(`DELETE FROM \`${table}\` WHERE id = ? AND device_id = ?`, [
      id,
      deviceId,
    ]);
    return NextResponse.json({ enabled: true, ok: true });
  } catch (e) {
    console.error("MySQL DELETE /api/lessons/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
