import React, { useMemo } from "react";
import type { ThemeTokens } from "@/themes/tokens";
import type { GraphVisualSlide } from "@/types/visual-slide";
import { deriveGraphVisualState } from "@/lib/graph-visual-state";

function layoutCircle(
  nodeIds: string[],
  w: number,
  h: number
): Record<string, { x: number; y: number }> {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.36;
  const out: Record<string, { x: number; y: number }> = {};
  const n = nodeIds.length;
  nodeIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    out[id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  return out;
}

export function SlideGraphVideo({
  visual,
  stepIndex,
  width,
  height,
  theme,
}: {
  visual: GraphVisualSlide;
  stepIndex: number;
  width: number;
  height: number;
  theme: ThemeTokens;
}) {
  const derived = useMemo(
    () => deriveGraphVisualState(visual.steps ?? [], stepIndex),
    [visual.steps, stepIndex]
  );

  const positions = useMemo(() => {
    const ids = visual.graph.nodes.map((n) => n.id);
    return layoutCircle(ids, width, height);
  }, [visual.graph.nodes, width, height]);

  const nodeById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of visual.graph.nodes) m.set(n.id, n.label);
    return m;
  }, [visual.graph.nodes]);

  const strokeHighlight = "#2563eb";
  const strokeEdge = theme.border || "#94a3b8";
  const fillDefault = "#64748b";
  const fillCurrent = "#2563eb";
  const fillVisited = "#059669";
  const fillHighlight = "#d97706";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      {visual.graph.edges.map((e) => {
        const ps = positions[e.source];
        const pt = positions[e.target];
        if (!ps || !pt) return null;
        const hl = derived.highlightedEdgeIds.has(e.id);
        const mx = (ps.x + pt.x) / 2;
        const my = (ps.y + pt.y) / 2 - 8;
        const label =
          e.weight != null
            ? String(e.weight)
            : e.label != null && e.label !== ""
              ? e.label
              : "";
        return (
          <g key={e.id}>
            <line
              x1={ps.x}
              y1={ps.y}
              x2={pt.x}
              y2={pt.y}
              stroke={hl ? strokeHighlight : strokeEdge}
              strokeWidth={hl ? 4 : 2}
              markerEnd={e.directed === false ? undefined : "url(#arrow)"}
            />
            {label ? (
              <text
                x={mx}
                y={my}
                fill={theme.textMuted}
                fontSize={13}
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            ) : null}
          </g>
        );
      })}
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={strokeEdge} />
        </marker>
      </defs>
      {visual.graph.nodes.map((n) => {
        const p = positions[n.id];
        if (!p) return null;
        let fill = fillDefault;
        if (derived.currentNodeId === n.id) fill = fillCurrent;
        else if (derived.visitedNodeIds.has(n.id)) fill = fillVisited;
        else if (derived.highlightedNodeIds.has(n.id)) fill = fillHighlight;
        const stroke =
          derived.currentNodeId === n.id ? "#93c5fd" : "rgba(255,255,255,0.2)";
        const sw = derived.currentNodeId === n.id ? 4 : 1;
        return (
          <g key={n.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={22}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <text
              x={p.x}
              y={p.y}
              dy={5}
              fill="#f8fafc"
              fontSize={14}
              fontWeight={600}
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              {nodeById.get(n.id) ?? n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
