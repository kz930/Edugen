import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: Request) {
  let body: { text?: string; slideIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const slideIndex = Number(body.slideIndex);
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (!Number.isInteger(slideIndex) || slideIndex < 1 || slideIndex > 500) {
    return NextResponse.json({ error: "slideIndex invalid" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const voiceId =
    process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const elevenRes = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!elevenRes.ok) {
    const errText = await elevenRes.text();
    return NextResponse.json(
      {
        error: "ElevenLabs request failed",
        detail: errText.slice(0, 500),
      },
      { status: elevenRes.status >= 400 ? elevenRes.status : 502 }
    );
  }

  const buf = Buffer.from(await elevenRes.arrayBuffer());
  const outDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outDir, { recursive: true });
  const filename = `audio-${slideIndex}.mp3`;
  const absPath = path.join(outDir, filename);
  await writeFile(absPath, buf);

  let durationInSeconds = 10;
  try {
    durationInSeconds = await getAudioDurationInSeconds(absPath);
    if (!Number.isFinite(durationInSeconds) || durationInSeconds <= 0) {
      durationInSeconds = 10;
    }
  } catch {
    durationInSeconds = 10;
  }

  return NextResponse.json({
    audioUrl: `/generated/${filename}`,
    durationInSeconds,
  });
}
