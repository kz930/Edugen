import React from "react";
import type { ThemeTokens } from "@/themes/tokens";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useRemotionLessonTheme } from "./LessonVideoThemeContext";

export type VideoDiagramPlan =
  | { type: "none" }
  | { type: "flow"; mode: "linear" | "comparison"; labels: string[] };

const STAGGER_SEC = 0.5;
const NODE_VISIBLE_PAD_SEC = 0.42;

const NODE_SHADOW =
  "0 12px 28px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)";

function cycleNodeStyle(
  theme: ThemeTokens,
  i: number
): { bg: string; text: string; border: string } {
  const keys = ["primary", "secondary", "highlight"] as const;
  return theme.nodes[keys[i % 3]!]!;
}

function nodeSpringProgress(frame: number, startFrame: number, fps: number): number {
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 17, stiffness: 128, mass: 0.85 },
  });
}

function edgeSpringProgress(frame: number, startFrame: number, fps: number): number {
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 20, stiffness: 140, mass: 0.75 },
  });
}

function LinearFlowAnimation({
  labels,
  frame,
  fps,
}: {
  labels: string[];
  frame: number;
  fps: number;
}) {
  const theme = useRemotionLessonTheme();
  const stagger = Math.round(STAGGER_SEC * fps);
  const settlePad = Math.round(NODE_VISIBLE_PAD_SEC * fps);
  const labelsCap = labels.slice(0, 8);
  const nodeW = 400;
  const nodeH = 88;
  const gapY = 24;
  const startX = 40;
  const startY = 36;
  const cx = startX + nodeW / 2;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 520 620"
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
      >
        {labelsCap.slice(0, -1).map((_, i) => {
          const edgeStart = stagger * (i + 1) + settlePad;
          const edgeP = edgeSpringProgress(frame, edgeStart, fps);
          const y1 = startY + i * (nodeH + gapY) + nodeH;
          const y2 = startY + (i + 1) * (nodeH + gapY);
          const segLen = Math.max(4, y2 - y1);
          const dashOffset = interpolate(edgeP, [0, 1], [segLen, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(edgeP, [0, 0.12, 1], [0, 0.9, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <line
              key={`e-${i}`}
              x1={cx}
              y1={y1}
              x2={cx}
              y2={y2}
              stroke={theme.accent}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={segLen}
              strokeDashoffset={dashOffset}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {labelsCap.map((label, i) => {
        const startFrame = stagger * i;
        const p = nodeSpringProgress(frame, startFrame, fps);
        const opacity = interpolate(p, [0, 0.15, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ty = interpolate(p, [0, 1], [36, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const top = startY + i * (nodeH + gapY);
        const ns = cycleNodeStyle(theme, i);
        return (
          <div
            key={`n-${i}`}
            style={{
              position: "absolute",
              left: startX,
              top,
              width: nodeW,
              height: nodeH,
              opacity,
              transform: `translateY(${ty}px)`,
              borderRadius: 16,
              backgroundColor: ns.bg,
              border: `2px solid ${ns.border}`,
              boxShadow: NODE_SHADOW,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: 19,
                fontWeight: 700,
                lineHeight: 1.25,
                color: ns.text,
              }}
            >
              {label}
            </p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function ComparisonFlowAnimation({
  labels,
  frame,
  fps,
}: {
  labels: [string, string];
  frame: number;
  fps: number;
}) {
  const theme = useRemotionLessonTheme();
  const stagger = Math.round(STAGGER_SEC * fps);
  const settlePad = Math.round(NODE_VISIBLE_PAD_SEC * fps);
  const [left, right] = labels;
  const nodeW = 300;
  const nodeH = 118;
  const topY = 140;
  const vbW = 880;
  const leftX = 56;
  const rightX = vbW - 56 - nodeW;
  const leftStyle = theme.nodes.primary;
  const rightStyle = theme.nodes.secondary;

  const p0 = nodeSpringProgress(frame, 0, fps);
  const p1 = nodeSpringProgress(frame, stagger, fps);

  const op0 = interpolate(p0, [0, 0.12, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op1 = interpolate(p1, [0, 0.12, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty0 = interpolate(p0, [0, 1], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty1 = interpolate(p1, [0, 1], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const edgeStart = stagger + settlePad;
  const edgeP = edgeSpringProgress(frame, edgeStart, fps);
  const x1 = leftX + nodeW;
  const x2 = rightX;
  const midY = topY + nodeH / 2;
  const lineLen = Math.max(8, x2 - x1);
  const dashOff = interpolate(edgeP, [0, 1], [lineLen, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edgeOpacity = interpolate(edgeP, [0, 0.1, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vbW} 420`}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
      >
        <line
          x1={x1}
          y1={midY}
          x2={x2}
          y2={midY}
          stroke={theme.border}
          strokeWidth={3}
          strokeDasharray={lineLen}
          strokeDashoffset={dashOff}
          opacity={edgeOpacity}
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: leftX,
          top: topY,
          width: nodeW,
          height: nodeH,
          opacity: op0,
          transform: `translateY(${ty0}px)`,
          borderRadius: 16,
          backgroundColor: leftStyle.bg,
          border: `2px solid ${leftStyle.border}`,
          boxShadow: NODE_SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.3,
            color: leftStyle.text,
          }}
        >
          {left}
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          left: rightX,
          top: topY,
          width: nodeW,
          height: nodeH,
          opacity: op1,
          transform: `translateY(${ty1}px)`,
          borderRadius: 16,
          backgroundColor: rightStyle.bg,
          border: `2px solid ${rightStyle.border}`,
          boxShadow: NODE_SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.3,
            color: rightStyle.text,
          }}
        >
          {right}
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function SlideFlowAnimation({ plan }: { plan: VideoDiagramPlan }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (plan.type !== "flow") return null;

  if (plan.mode === "comparison" && plan.labels.length >= 2) {
    return (
      <ComparisonFlowAnimation
        labels={[plan.labels[0]!, plan.labels[1]!]}
        frame={frame}
        fps={fps}
      />
    );
  }

  if (plan.mode === "linear" && plan.labels.length > 0) {
    return <LinearFlowAnimation labels={plan.labels} frame={frame} fps={fps} />;
  }

  return null;
}
