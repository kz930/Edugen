import { getLocalAudioDurationSeconds } from "@/lib/audio-duration";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_ELEVEN_VOICE = "21m00Tcm4TlvDq8ikWAM";
const OPENAI_TTS_MAX_CHARS = 4096;

type TtsProvider = "openai" | "elevenlabs";

function resolveTtsProvider(): TtsProvider {
  const explicit = process.env.AUDIO_TTS_PROVIDER?.trim().toLowerCase();
  if (explicit === "openai" || explicit === "elevenlabs") {
    return explicit;
  }
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasEleven = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  if (hasOpenAI && !hasEleven) return "openai";
  if (!hasOpenAI && hasEleven) return "elevenlabs";
  if (hasOpenAI && hasEleven) return "openai";
  return "openai";
}

async function synthesizeOpenAI(text: string): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const model = process.env.OPENAI_TTS_MODEL?.trim() || "tts-1";
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || "nova";
  const input = text.slice(0, OPENAI_TTS_MAX_CHARS);

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText.slice(0, 800));
  }
  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_ELEVEN_VOICE;
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
    throw new Error(errText.slice(0, 800));
  }
  return Buffer.from(await elevenRes.arrayBuffer());
}

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

  const provider = resolveTtsProvider();
  let buf: Buffer;

  try {
    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error: "OpenAI TTS selected but OPENAI_API_KEY is not set",
            detail:
              "Set OPENAI_API_KEY in .env.local, or set AUDIO_TTS_PROVIDER=elevenlabs to use ElevenLabs.",
          },
          { status: 500 }
        );
      }
      buf = await synthesizeOpenAI(text);
    } else {
      if (!process.env.ELEVENLABS_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error: "ElevenLabs TTS selected but ELEVENLABS_API_KEY is not set",
            detail:
              "Set ELEVENLABS_API_KEY, or set AUDIO_TTS_PROVIDER=openai and OPENAI_API_KEY to use OpenAI speech.",
          },
          { status: 500 }
        );
      }
      buf = await synthesizeElevenLabs(text);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const label = provider === "openai" ? "OpenAI TTS" : "ElevenLabs";
    return NextResponse.json(
      {
        error: `${label} request failed`,
        detail: message,
      },
      { status: 502 }
    );
  }

  const outDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outDir, { recursive: true });
  const filename = `audio-${slideIndex}.mp3`;
  const absPath = path.join(outDir, filename);
  await writeFile(absPath, buf);

  let durationInSeconds = 10;
  const fromMeta = await getLocalAudioDurationSeconds(absPath);
  if (fromMeta != null) {
    durationInSeconds = Math.max(1, fromMeta + 0.35);
  }

  return NextResponse.json({
    audioUrl: `/generated/${filename}`,
    durationInSeconds,
    provider,
  });
}
