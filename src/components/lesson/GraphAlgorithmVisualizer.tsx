"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { GraphVisualSlide } from "@/types/visual-slide";
import { countGraphSteps, deriveGraphVisualState } from "@/lib/graph-visual-state";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [
  { label: "0.4s", ms: 400 },
  { label: "0.8s", ms: 800 },
  { label: "1.2s", ms: 1200 },
  { label: "2s", ms: 2000 },
] as const;

const baseStylesheet = [
  {
    selector: "node",
    style: {
      "background-color": "#64748b",
      label: "data(label)",
      color: "#f8fafc",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": "14px",
      "font-weight": "600",
      width: 48,
      height: 48,
    },
  },
  {
    selector: "node.current",
    style: {
      "background-color": "#2563eb",
      "border-width": 4,
      "border-color": "#93c5fd",
    },
  },
  {
    selector: "node.visited",
    style: {
      "background-color": "#059669",
    },
  },
  {
    selector: "node.highlight",
    style: {
      "background-color": "#d97706",
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      label: "data(label)",
      "font-size": "11px",
      color: "#475569",
    },
  },
  {
    selector: "edge.undirected",
    style: {
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "edge.highlight",
    style: {
      "line-color": "#2563eb",
      width: 4,
    },
  },
];

function nodeClasses(
  id: string,
  d: ReturnType<typeof deriveGraphVisualState>
): string {
  const c: string[] = [];
  if (d.visitedNodeIds.has(id)) c.push("visited");
  if (d.currentNodeId === id) c.push("current");
  if (d.highlightedNodeIds.has(id)) c.push("highlight");
  return c.join(" ");
}

function buildElements(
  visual: GraphVisualSlide,
  d: ReturnType<typeof deriveGraphVisualState>
) {
  const nodeEls = visual.graph.nodes.map((n) => ({
    data: { id: n.id, label: n.label },
    classes: nodeClasses(n.id, d),
  }));
  const edgeEls = visual.graph.edges.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      label:
        e.weight != null
          ? String(e.weight)
          : e.label != null && e.label !== ""
            ? e.label
            : "",
    },
    classes:
      (d.highlightedEdgeIds.has(e.id) ? "highlight " : "") +
      (e.directed === false ? "undirected" : ""),
  }));
  return CytoscapeComponent.normalizeElements({
    nodes: nodeEls,
    edges: edgeEls,
  });
}

export function GraphAlgorithmVisualizer({
  visual,
  accentClassName,
}: {
  visual: GraphVisualSlide;
  accentClassName?: string;
}) {
  const stepCount = visual.steps?.length ?? 0;
  const maxIndex = Math.max(0, stepCount - 1);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [visual]);

  const derived = useMemo(
    () => deriveGraphVisualState(visual.steps ?? [], stepIndex),
    [visual.steps, stepIndex]
  );

  const elements = useMemo(() => {
    try {
      return buildElements(visual, derived);
    } catch {
      return [];
    }
  }, [visual, derived]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStepIndex((i) => {
        if (i >= maxIndex) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [playing, speedMs, maxIndex]);

  const step = (visual.steps ?? [])[stepIndex];
  const algoLabel = visual.algorithm.toUpperCase();

  const showQueue =
    visual.algorithm === "bfs" || visual.algorithm === "generic";
  const showStack = visual.algorithm === "dfs" || visual.algorithm === "generic";
  const showDistances = visual.algorithm === "dijkstra";

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIndex(0);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div
          className={cn(
            "relative min-h-[280px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner",
            accentClassName
          )}
        >
          {elements.length > 0 ? (
            <CytoscapeComponent
              key={visual.graph.nodes.map((n) => n.id).join("-")}
              elements={elements}
              stylesheet={baseStylesheet as never}
              layout={{
                name: "breadthfirst",
                directed: true,
                spacingFactor: 1.35,
                roots: `#${visual.graph.nodes[0]?.id ?? "A"}`,
                animate: false,
              }}
              style={{ width: "100%", height: "min(420px, 55vh)" }}
              cy={(cy) => {
                try {
                  cy.fit(undefined, 48);
                } catch {
                  /* ignore */
                }
              }}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
              No graph elements
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:w-[380px] lg:shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {algoLabel} · Step {stepIndex + 1} / {countGraphSteps(visual)}
            </span>
          </div>
          {step ? (
            <>
              <h3 className="text-lg font-semibold leading-snug text-slate-900">
                {step.title}
              </h3>
              <p className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-base font-medium leading-relaxed text-blue-950">
                {step.subtitle}
              </p>
              <p className="text-sm leading-relaxed text-slate-700">{step.narration}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No steps defined.</p>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Data structures
            </p>
            {showQueue ? (
              <div className="rounded-md bg-slate-50 px-2 py-1.5 font-mono text-slate-800">
                <span className="text-slate-500">Queue (front → back): </span>
                [{derived.queue.join(", ") || " "}]
              </div>
            ) : null}
            {showStack ? (
              <div className="rounded-md bg-slate-50 px-2 py-1.5 font-mono text-slate-800">
                <span className="text-slate-500">Stack (top → bottom): </span>
                [{derived.stack.join(", ") || " "}]
              </div>
            ) : null}
            {showDistances ? (
              <div className="rounded-md bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-800">
                <span className="text-slate-500">Distances: </span>
                {Object.keys(derived.distances).length === 0
                  ? "(none)"
                  : Object.entries(derived.distances)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
              </div>
            ) : null}
            {derived.note ? (
              <p className="rounded-md border border-amber-100 bg-amber-50 px-2 py-1.5 text-amber-950">
                <span className="font-medium">Note: </span>
                {derived.note}
              </p>
            ) : null}
            <div className="text-xs text-slate-500">
              Visited:{" "}
              {Array.from(derived.visitedNodeIds).join(", ") || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-center text-sm font-medium leading-snug text-slate-800 md:text-base">
          {step?.subtitle ?? "—"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPlaying(false);
              setStepIndex((i) => Math.max(0, i - 1));
            }}
            disabled={stepIndex <= 0}
          >
            <SkipBack className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setPlaying((p) => !p)}
            disabled={stepCount === 0}
          >
            {playing ? (
              <>
                <Pause className="mr-1 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" /> Play
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setStepIndex((i) => Math.min(maxIndex, i + 1))
            }
            disabled={stepIndex >= maxIndex}
          >
            Next
            <SkipForward className="ml-1 h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Speed</span>
            <select
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
            >
              {SPEEDS.map((s) => (
                <option key={s.ms} value={s.ms}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
