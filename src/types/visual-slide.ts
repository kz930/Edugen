/**
 * Visual storyboard types for algorithmic / diagram slides (graph, diagram, equation).
 */

export type GraphAlgorithmKind = "bfs" | "dfs" | "dijkstra" | "generic";

export interface GraphNodeSpec {
  id: string;
  label: string;
}

export interface GraphEdgeSpec {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  directed?: boolean;
}

export type GraphVisualAction =
  | { type: "highlight_node"; nodeId: string }
  | { type: "highlight_edge"; edgeId: string }
  | { type: "mark_visited"; nodeId: string }
  | { type: "mark_current"; nodeId: string }
  | { type: "enqueue"; nodeId: string }
  | { type: "dequeue"; nodeId: string }
  | { type: "push_stack"; nodeId: string }
  | { type: "pop_stack"; nodeId: string }
  | { type: "update_distance"; nodeId: string; distance: number }
  | { type: "set_note"; text: string };

export interface GraphVisualStep {
  id: string;
  title: string;
  narration: string;
  /** Short line shown as subtitle — must describe this frame’s visual change. */
  subtitle: string;
  actions: GraphVisualAction[];
}

export interface GraphVisualSlide {
  kind: "graph";
  algorithm: GraphAlgorithmKind;
  graph: {
    nodes: GraphNodeSpec[];
    edges: GraphEdgeSpec[];
  };
  steps: GraphVisualStep[];
}

/** Placeholder for flowcharts / boxes-arrows (extensible later). */
export interface DiagramVisualSlide {
  kind: "diagram";
  title?: string;
  description?: string;
  /** Future: structured boxes/links */
  elements?: unknown[];
}

/** Equation / math slide — optional Desmos-style expression string for future embed. */
export interface EquationVisualSlide {
  kind: "equation";
  title?: string;
  expression?: string;
  /** Reserved for future Desmos calculator embed. */
  desmosExpression?: string;
}

export type VisualSlide = GraphVisualSlide | DiagramVisualSlide | EquationVisualSlide;

export function isGraphVisual(v: VisualSlide | null | undefined): v is GraphVisualSlide {
  return v != null && v.kind === "graph";
}

export function isDiagramVisual(v: VisualSlide | null | undefined): v is DiagramVisualSlide {
  return v != null && v.kind === "diagram";
}

export function isEquationVisual(v: VisualSlide | null | undefined): v is EquationVisualSlide {
  return v != null && v.kind === "equation";
}
