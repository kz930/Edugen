import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getLocalAudioDurationSeconds } from "@/lib/audio-duration";
import {
  buildDiagramPlan,
  visualPlanToRemotionDiagram,
} from "@/lib/slide-mermaid";
import { getEffectiveCodeSnippet } from "@/lib/slide-code-snippet";
import { tryRepairVisual } from "@/lib/sanitize-slide-visual";
import { isValidGraphVisualSlide } from "@/lib/validate-visual-slide";
import type { GraphVisualSlide } from "@/types/visual-slide";
import { parsePreviewThemeId } from "@/themes/tokens";
import type { SlideContent } from "@/types/lesson";
import { access, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { constants as fsConstants } from "node:fs";

export const runtime = "nodejs";
export const maxDuration = 300;

let bundlePromise: Promise<string> | null = null;

import type { Configuration } from "webpack";

/** Remotion's webpack does not read tsconfig `paths`; mirror Next's `@` → `src`. */
function remotionWebpackOverride(config: Configuration): Configuration {
  const src = path.join(process.cwd(), "src");
  const prev = config.resolve?.alias;
  const base =
    prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {};
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...base,
        "@": src,
      },
    },
  };
}

function getBundledServeUrl(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: remotionWebpackOverride,
      publicDir: path.join(process.cwd(), "public"),
    });
  }
  return bundlePromise;
}

type RenderBody = {
  slideIndex?: number;
  title?: string;
  bullets?: string[];
  audioUrl?: string;
  durationInSeconds?: number;
  narrationScript?: string;
  mainIdea?: string;
  visualSuggestion?: string;
  visualIdea?: string;
  codeSnippet?: string;
  themeName?: string;
  /** Raw slide.visual — graph storyboard passed through to Remotion when valid. */
  visual?: unknown;
};

export async function POST(req: Request) {
  let body: RenderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slideIndex = Number(body.slideIndex);
  const title = typeof body.title === "string" ? body.title : "";
  const bullets = Array.isArray(body.bullets)
    ? body.bullets.filter((b): b is string => typeof b === "string")
    : [];
  const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl.trim() : "";
  const narrationScript =
    typeof body.narrationScript === "string" ? body.narrationScript : "";

  if (!Number.isInteger(slideIndex) || slideIndex < 1 || slideIndex > 500) {
    return NextResponse.json({ error: "slideIndex invalid" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!audioUrl || !audioUrl.startsWith("/generated/")) {
    return NextResponse.json({ error: "audioUrl invalid" }, { status: 400 });
  }

  const rel = audioUrl.replace(/^\//, "");
  const audioFilePath = path.join(process.cwd(), "public", rel);

  try {
    await access(audioFilePath, fsConstants.F_OK);
  } catch {
    return NextResponse.json(
      { error: "Audio file not found", detail: audioFilePath },
      { status: 400 }
    );
  }

  let durationInSeconds = 10;
  const fromMeta = await getLocalAudioDurationSeconds(audioFilePath);
  if (fromMeta != null) {
    durationInSeconds = Math.max(1, fromMeta + 0.35);
  } else {
    const fromBody = Number(body.durationInSeconds);
    if (Number.isFinite(fromBody) && fromBody > 0) {
      durationInSeconds = fromBody;
    }
  }

  // Remotion only downloads http(s) assets. Serve MP3 from this Next app (public/).
  let audioHttpUrl: string;
  try {
    audioHttpUrl = new URL(audioUrl, req.url).href;
  } catch {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
    audioHttpUrl = `${base}${audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`}`;
  }

  const slideForPlan: SlideContent = {
    slideNumber: slideIndex,
    title,
    mainIdea: typeof body.mainIdea === "string" ? body.mainIdea : "",
    bullets,
    visualSuggestion:
      typeof body.visualSuggestion === "string" ? body.visualSuggestion : "",
    visualIdea: typeof body.visualIdea === "string" ? body.visualIdea : undefined,
    codeSnippet:
      typeof body.codeSnippet === "string" && body.codeSnippet.trim()
        ? body.codeSnippet
        : undefined,
    speakerNotes: "",
    sourceIds: [],
  };

  let graphVisual: GraphVisualSlide | undefined;
  if (body.visual != null) {
    const repaired = tryRepairVisual(body.visual);
    if (repaired && isValidGraphVisualSlide(repaired)) {
      graphVisual = repaired;
    } else if (isValidGraphVisualSlide(body.visual)) {
      // Use model output as-is when already valid (repair can drop steps with empty narration).
      graphVisual = body.visual;
    }
  }

  const diagramPlan = visualPlanToRemotionDiagram(buildDiagramPlan(slideForPlan));
  const codeForVideo = getEffectiveCodeSnippet(slideForPlan);

  const themeName = parsePreviewThemeId(body.themeName) ?? "cs";

  const inputProps = {
    title,
    bullets,
    audioHttpUrl,
    durationInSeconds,
    narrationScript,
    diagramPlan,
    themeName,
    codeSnippet: codeForVideo ?? undefined,
    graphVisual: graphVisual ?? undefined,
  };

  try {
    const serveUrl = await getBundledServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: "SlideVideo",
      inputProps,
    });

    const outDir = path.join(process.cwd(), "public", "generated");
    await mkdir(outDir, { recursive: true });
    const outName = `video-${slideIndex}.mp4`;
    const outputLocation = path.join(outDir, outName);

    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      outputLocation,
      inputProps,
      overwrite: true,
    });

    return NextResponse.json({
      videoUrl: `/generated/${outName}`,
      durationInSeconds,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[render-video]", message, stack ?? "");
    return NextResponse.json(
      { error: "Render failed", detail: message },
      { status: 500 }
    );
  }
}
