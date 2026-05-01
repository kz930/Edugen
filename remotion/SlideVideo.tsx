import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SlideVideoProps = {
  title: string;
  bullets: string[];
  /** Absolute http(s) URL to the MP3 (Next serves `public/`). Remotion only loads http(s). */
  audioHttpUrl: string;
  durationInSeconds: number;
  narrationScript: string;
};

export const SlideVideo: React.FC<SlideVideoProps> = ({
  title,
  bullets,
  audioHttpUrl,
  durationInSeconds,
  narrationScript,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const segments = useMemo(() => {
    const raw = (narrationScript || title || "").trim();
    const parts = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
    return parts.length ? parts : [raw || title];
  }, [narrationScript, title]);

  const segDur = durationInSeconds / Math.max(1, segments.length);
  const segIdx = Math.min(
    segments.length - 1,
    Math.max(0, Math.floor(t / segDur))
  );
  const subtitle = segments[segIdx] ?? "";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        padding: 60,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: "#0d9488",
        }}
      />

      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 32,
          marginTop: 8,
        }}
      >
        {title}
      </h1>

      {bullets.map((bullet, i) => {
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
              marginBottom: 16,
              opacity,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#0d9488",
                marginRight: 16,
                flexShrink: 0,
              }}
            />
            <p style={{ fontSize: 28, color: "#334155", margin: 0 }}>{bullet}</p>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          right: 60,
          backgroundColor: "rgba(0,0,0,0.75)",
          borderRadius: 8,
          padding: "12px 20px",
        }}
      >
        <p
          style={{
            color: "white",
            fontSize: 22,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </p>
      </div>

      {audioHttpUrl ? <Audio src={audioHttpUrl} /> : null}
    </AbsoluteFill>
  );
};
