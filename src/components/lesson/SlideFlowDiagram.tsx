"use client";

import "@xyflow/react/dist/style.css";

import type { SlideVisualPlan } from "@/lib/slide-mermaid";
import type { ThemeTokens } from "@/themes/tokens";
import { themeTokens } from "@/themes/tokens";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useMemo } from "react";

type ChainEnds = "start" | "mid" | "end";

function SlideChainNode({ data }: NodeProps) {
  const label = String(data?.label ?? "");
  const ends = data?.ends as ChainEnds | undefined;
  const fill = String(data?.fill ?? "#1E293B");
  const stroke = String(data?.stroke ?? "#334155");
  const fg = String(data?.fg ?? "#F1F5F9");
  return (
    <div className="relative">
      {(ends === "mid" || ends === "end") && (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className="!h-2.5 !w-2.5 !border-2"
          style={{ borderColor: stroke, backgroundColor: fill }}
        />
      )}
      <div
        className="min-w-[200px] max-w-[300px] rounded-2xl px-4 py-3.5 shadow-xl ring-1"
        style={{
          backgroundColor: fill,
          border: `2px solid ${stroke}`,
          color: fg,
          boxShadow: "0 12px 28px rgba(15,23,42,0.25)",
        }}
      >
        <p className="text-center text-[13px] font-semibold leading-snug">{label}</p>
      </div>
      {(ends === "start" || ends === "mid") && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="!h-2.5 !w-2.5 !border-2"
          style={{ borderColor: stroke, backgroundColor: fill }}
        />
      )}
    </div>
  );
}

function SlideCompareNode({ data }: NodeProps) {
  const label = String(data?.label ?? "");
  const fill = String(data?.fill ?? "#1E293B");
  const stroke = String(data?.stroke ?? "#334155");
  const fg = String(data?.fg ?? "#F1F5F9");
  const side = data?.side as "left" | "right" | undefined;
  return (
    <div className="relative">
      {side === "right" ? (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          className="!h-2.5 !w-2.5 !border-2"
          style={{ borderColor: stroke, backgroundColor: fill }}
        />
      ) : null}
      <div
        className="min-w-[200px] max-w-[280px] rounded-2xl px-4 py-4 shadow-xl ring-1"
        style={{
          backgroundColor: fill,
          border: `2px solid ${stroke}`,
          color: fg,
          boxShadow: "0 14px 32px rgba(15,23,42,0.28)",
        }}
      >
        <p className="text-center text-[13px] font-semibold leading-snug">{label}</p>
      </div>
      {side === "left" ? (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          className="!h-2.5 !w-2.5 !border-2"
          style={{ borderColor: stroke, backgroundColor: fill }}
        />
      ) : null}
    </div>
  );
}

const nodeTypes = {
  slideChain: SlideChainNode,
  slideCompare: SlideCompareNode,
};

function cycleStyle(tokens: ThemeTokens, i: number) {
  const keys = ["primary", "secondary", "highlight"] as const;
  return tokens.nodes[keys[i % 3]!]!;
}

function buildLinearFlow(labels: string[], tokens: ThemeTokens): { nodes: Node[]; edges: Edge[] } {
  const accent = tokens.accent;
  const nodes: Node[] = labels.map((label, i) => {
    const ends: ChainEnds =
      i === 0 ? "start" : i === labels.length - 1 ? "end" : "mid";
    const s = cycleStyle(tokens, i);
    return {
      id: `n${i}`,
      type: "slideChain",
      position: { x: 70, y: 20 + i * 128 },
      data: { label, ends, fill: s.bg, stroke: s.border, fg: s.text },
    };
  });
  const edges: Edge[] = [];
  for (let i = 0; i < labels.length - 1; i++) {
    edges.push({
      id: `e${i}-${i + 1}`,
      source: `n${i}`,
      target: `n${i + 1}`,
      sourceHandle: "out",
      targetHandle: "in",
      animated: true,
      style: { stroke: accent, strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: accent,
        width: 18,
        height: 18,
      },
    });
  }
  return { nodes, edges };
}

function buildComparisonFlow(
  labels: [string, string],
  tokens: ThemeTokens
): { nodes: Node[]; edges: Edge[] } {
  const [a, b] = labels;
  const left = tokens.nodes.primary;
  const right = tokens.nodes.secondary;
  const strokeEdge = tokens.border;
  const nodes: Node[] = [
    {
      id: "c0",
      type: "slideCompare",
      position: { x: 20, y: 70 },
      data: {
        label: a,
        side: "left",
        fill: left.bg,
        stroke: left.border,
        fg: left.text,
      },
    },
    {
      id: "c1",
      type: "slideCompare",
      position: { x: 340, y: 70 },
      data: {
        label: b,
        side: "right",
        fill: right.bg,
        stroke: right.border,
        fg: right.text,
      },
    },
  ];
  const edges: Edge[] = [
    {
      id: "cmp",
      source: "c0",
      target: "c1",
      sourceHandle: "out",
      targetHandle: "in",
      animated: true,
      style: { stroke: strokeEdge, strokeWidth: 2, strokeDasharray: "6 4" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeEdge,
        width: 16,
        height: 16,
      },
    },
  ];
  return { nodes, edges };
}

function SlideFlowInner({
  plan,
  tokens,
}: {
  plan: Extract<SlideVisualPlan, { type: "flow" }>;
  tokens: ThemeTokens;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (plan.mode === "comparison") {
      return buildComparisonFlow([plan.labels[0]!, plan.labels[1]!], tokens);
    }
    return buildLinearFlow(plan.labels, tokens);
  }, [plan, tokens]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll
      zoomOnScroll={false}
      proOptions={{ hideAttribution: true }}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.12 }}
      className="!bg-transparent h-full w-full min-h-[220px]"
    >
      <Background
        color={tokens.textMuted}
        variant={BackgroundVariant.Dots}
        gap={14}
        size={1}
      />
      <Controls
        className="!overflow-hidden !rounded-lg !shadow-lg [&_button]:hover:!bg-black/5"
        style={{
          border: `1px solid ${tokens.border}`,
          backgroundColor: tokens.bgSecondary,
        }}
        showInteractive={false}
      />
    </ReactFlow>
  );
}

export function SlideFlowDiagram({
  plan,
  tokens = themeTokens.cs,
}: {
  plan: Extract<SlideVisualPlan, { type: "flow" }>;
  tokens?: ThemeTokens;
}) {
  const key = `${plan.mode}-${plan.labels.join("¦")}-${tokens.bg}`;
  return (
    <div
      className="h-[min(22rem,48vh)] min-h-[240px] w-full min-w-0 overflow-hidden rounded-xl shadow-inner"
      style={{
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.bgSecondary,
      }}
    >
      <ReactFlowProvider>
        <div className="h-full w-full min-h-[240px]">
          <SlideFlowInner key={key} plan={plan} tokens={tokens} />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
