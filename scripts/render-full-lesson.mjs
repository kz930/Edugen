#!/usr/bin/env node
/**
 * Renders every slide that has a non-empty narration script (via local Next APIs),
 * then concatenates outputs with ffmpeg concat demuxer.
 *
 * Requires: dev server or `next start` on --base-url, ELEVENLABS_API_KEY, ffmpeg on PATH.
 *
 * Usage:
 *   npm run render:full -- --lesson path/to/lesson.json
 *   npm run render:full -- --lesson path/to/lesson.json --base-url http://127.0.0.1:3000 --out public/generated/final_output.mp4
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultGenerated = path.join(repoRoot, "public", "generated");

function parseArgs(argv) {
  const out = {
    lesson: null,
    baseUrl: "http://127.0.0.1:3000",
    out: path.join(defaultGenerated, "final_output.mp4"),
    concatPath: path.join(defaultGenerated, "concat.txt"),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--lesson" && argv[i + 1]) {
      out.lesson = argv[++i];
    } else if (a === "--base-url" && argv[i + 1]) {
      out.baseUrl = argv[++i].replace(/\/$/, "");
    } else if (a === "--out" && argv[i + 1]) {
      out.out = path.resolve(repoRoot, argv[++i]);
    } else if (a === "--concat" && argv[i + 1]) {
      out.concatPath = path.resolve(repoRoot, argv[++i]);
    }
  }
  return out;
}

function ffmpegQuotePath(absPath) {
  const s = absPath.replace(/\\/g, "/");
  return s.replace(/'/g, "'\\''");
}

function ensureFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    console.error("ffmpeg not found or failed. Install ffmpeg and ensure it is on PATH.");
    process.exit(1);
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.lesson) {
    console.error(`Usage: node scripts/render-full-lesson.mjs --lesson <path-to-lesson.json> [--base-url URL] [--out path/to/final_output.mp4] [--concat path/to/concat.txt]`);
    process.exit(1);
  }

  const lessonPath = path.resolve(repoRoot, args.lesson);
  if (!existsSync(lessonPath)) {
    console.error(`Lesson file not found: ${lessonPath}`);
    process.exit(1);
  }

  let lesson;
  try {
    lesson = JSON.parse(readFileSync(lessonPath, "utf8"));
  } catch (e) {
    console.error("Invalid lesson JSON:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const slides = lesson?.lessonData?.slides;
  const narration = lesson?.lessonData?.narration;
  if (!Array.isArray(slides) || !Array.isArray(narration)) {
    console.error("Lesson JSON must include lessonData.slides and lessonData.narration arrays.");
    process.exit(1);
  }

  const slideByNumber = new Map(slides.map((s) => [s.slideNumber, s]));
  const toRender = narration
    .filter((n) => typeof n.script === "string" && n.script.trim())
    .map((n) => ({ slideNumber: n.slideNumber, script: n.script.trim() }))
    .sort((a, b) => a.slideNumber - b.slideNumber);

  if (!toRender.length) {
    console.error("No narration scripts found. Add scripts to narration entries first.");
    process.exit(1);
  }

  ensureFfmpeg();

  const base = args.baseUrl.replace(/\/$/, "");

  for (let i = 0; i < toRender.length; i++) {
    const { slideNumber, script } = toRender[i];
    const slide = slideByNumber.get(slideNumber);
    if (!slide) {
      console.error(`No slide content for slideNumber ${slideNumber}; aborting.`);
      process.exit(1);
    }

    console.log(`[${i + 1}/${toRender.length}] Slide ${slideNumber}: audio…`);
    const audio = await postJson(`${base}/api/generate-audio`, {
      text: script,
      slideIndex: slideNumber,
    });
    if (!audio.ok) {
      const err = audio.data?.error ?? "request failed";
      const detail = audio.data?.detail ? `: ${audio.data.detail}` : "";
      console.error(`generate-audio failed (${audio.status}): ${err}${detail}`);
      process.exit(1);
    }
    const { audioUrl, durationInSeconds } = audio.data;
    if (typeof audioUrl !== "string" || !audioUrl.startsWith("/generated/")) {
      console.error("Unexpected generate-audio response:", audio.data);
      process.exit(1);
    }

    console.log(`[${i + 1}/${toRender.length}] Slide ${slideNumber}: video…`);
    const render = await postJson(`${base}/api/render-video`, {
      slideIndex: slideNumber,
      title: slide.title,
      bullets: slide.bullets ?? [],
      mainIdea: slide.mainIdea ?? "",
      visualSuggestion: slide.visualSuggestion ?? "",
      visualIdea: slide.visualIdea,
      audioUrl,
      durationInSeconds:
        typeof durationInSeconds === "number" && durationInSeconds > 0
          ? durationInSeconds
          : 10,
      narrationScript: script,
    });
    if (!render.ok) {
      const err = render.data?.error ?? "request failed";
      const detail = render.data?.detail ? `: ${render.data.detail}` : "";
      console.error(`render-video failed (${render.status}): ${err}${detail}`);
      process.exit(1);
    }
  }

  const lines = toRender.map(({ slideNumber }) => {
    const abs = path.join(defaultGenerated, `video-${slideNumber}.mp4`);
    if (!existsSync(abs)) {
      console.error(`Expected file missing after render: ${abs}`);
      process.exit(1);
    }
    return `file '${ffmpegQuotePath(abs)}'`;
  });

  mkdirSync(path.dirname(args.concatPath), { recursive: true });
  writeFileSync(args.concatPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${args.concatPath} (${lines.length} segments).`);

  const outDir = path.dirname(args.out);
  if (outDir && !existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const concatAbs = path.resolve(args.concatPath);
  console.log("Running ffmpeg concat (stream copy)…");
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", concatAbs, "-c", "copy", args.out],
    { stdio: "inherit", cwd: repoRoot }
  );
  if (ff.status !== 0) {
    console.error("ffmpeg exited with non-zero status.");
    process.exit(ff.status ?? 1);
  }
  console.log(`Done: ${args.out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
