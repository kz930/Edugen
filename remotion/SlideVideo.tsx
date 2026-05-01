import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PreviewThemeId } from "@/themes/tokens";
import { themeFontStack } from "@/themes/tokens";
import { splitNarrationSegments } from "@/lib/narration-segments";
import {
  RemotionLessonThemeProvider,
  useRemotionLessonTheme,
} from "./LessonVideoThemeContext";
import { SlideFlowAnimation, type VideoDiagramPlan } from "./SlideFlowAnimation";
import { looksLikeCode } from "@/lib/slide-code-snippet";

export type SlideVideoProps = {
  title: string;
  bullets: string[];
  audioHttpUrl: string;
  durationInSeconds: number;
  narrationScript: string;
  diagramPlan: VideoDiagramPlan;
  themeName: PreviewThemeId;
  /** Raw code only; prose placeholders are ignored (same rules as slide preview). */
  codeSnippet?: string;
};

function SlideVideoBody({
  title,
  bullets,
  audioHttpUrl,
  durationInSeconds,
  narrationScript,
  diagramPlan,
  codeSnippet,
}: Omit<SlideVideoProps, "themeName">) {
  const theme = useRemotionLessonTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const segments = useMemo(
    () => splitNarrationSegments(narrationScript, title),
    [narrationScript, title]
  );

  const segDur = durationInSeconds / Math.max(1, segments.length);
  const segIdx = Math.min(
    segments.length - 1,
    Math.max(0, Math.floor(t / segDur))
  );
  const subtitle = segments[segIdx] ?? "";

  const effectiveCode =
    codeSnippet?.trim() && looksLikeCode(codeSnippet.trim())
      ? codeSnippet.trim()
      : null;

  const showCodePanel = Boolean(effectiveCode);
  const showFlowDiagram = diagramPlan.type === "flow" && !showCodePanel;

  const titleFont = themeFontStack("fontTitle", theme);
  const bodyFont = themeFontStack("fontBody", theme);

  const bulletBlock = (compact: boolean) =>
    bullets.map((bullet, i) => {
      const appearsAt =
        (durationInSeconds / Math.max(bullets.length + 1, 2)) * (i + 1);
      const opacity = interpolate(
        t,
        [Math.max(0, appearsAt - 0.35), appearsAt],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      return (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: compact ? 12 : 16,
            opacity,
            fontFamily: bodyFont,
          }}
        >
          <div
            style={{
              width: compact ? 8 : 10,
              height: compact ? 8 : 10,
              borderRadius: "50%",
              backgroundColor: theme.accent,
              marginRight: compact ? 12 : 16,
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontSize: compact ? 20 : 28,
              color: theme.textMuted,
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            {bullet}
          </p>
        </div>
      );
    });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        padding: 60,
        fontFamily: bodyFont,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.topBarStart}, ${theme.topBarEnd})`,
        }}
      />

      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: theme.textPrimary,
          marginBottom: showFlowDiagram || showCodePanel ? 20 : 32,
          marginTop: 8,
          fontFamily: titleFont,
        }}
      >
        {title}
      </h1>

      {showFlowDiagram ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 36,
            alignItems: "flex-start",
            marginTop: 8,
          }}
        >
          <div style={{ flex: "1 1 50%", minWidth: 0, maxWidth: "52%" }}>
            {bulletBlock(true)}
          </div>
          <div
            style={{
              flex: "0 0 46%",
              minHeight: 500,
              position: "relative",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
              overflow: "hidden",
            }}
          >
            <SlideFlowAnimation plan={diagramPlan} />
          </div>
        </div>
      ) : showCodePanel ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 36,
            alignItems: "flex-start",
            marginTop: 8,
          }}
        >
          <div style={{ flex: "1 1 50%", minWidth: 0, maxWidth: "52%" }}>
            {bulletBlock(true)}
          </div>
          <div
            style={{
              flex: "0 0 46%",
              minHeight: 420,
              maxHeight: 520,
              position: "relative",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
              overflow: "auto",
              padding: "18px 22px",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 17,
              lineHeight: 1.45,
              color: theme.textMuted,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {effectiveCode}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>{bulletBlock(false)}</div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          right: 60,
          backgroundColor: theme.bgSecondary,
          borderRadius: 8,
          padding: "12px 20px",
          border: `1px solid ${theme.border}`,
        }}
      >
        <p
          style={{
            color: theme.textPrimary,
            fontSize: 22,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.35,
            fontFamily: bodyFont,
          }}
        >
          {subtitle}
        </p>
      </div>

      {audioHttpUrl ? <Audio src={audioHttpUrl} /> : null}
    </AbsoluteFill>
  );
}

export const SlideVideo: React.FC<SlideVideoProps> = ({
  themeName,
  ...rest
}) => {
  return (
    <RemotionLessonThemeProvider themeName={themeName}>
      <SlideVideoBody {...rest} />
    </RemotionLessonThemeProvider>
  );
};
