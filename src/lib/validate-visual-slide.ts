import type {
  GraphEdgeSpec,
  GraphNodeSpec,
  GraphVisualSlide,
  GraphVisualStep,
  VisualSlide,
} from "@/types/visual-slide";

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function validNode(x: unknown): x is GraphNodeSpec {
  if (!isRecord(x)) return false;
  return typeof x.id === "string" && typeof x.label === "string";
}

function validEdge(x: unknown): x is GraphEdgeSpec {
  if (!isRecord(x)) return false;
  return (
    typeof x.id === "string" &&
    typeof x.source === "string" &&
    typeof x.target === "string"
  );
}

function validAction(x: unknown): boolean {
  if (!isRecord(x) || typeof x.type !== "string") return false;
  switch (x.type) {
    case "highlight_node":
    case "mark_visited":
    case "mark_current":
    case "enqueue":
    case "dequeue":
    case "push_stack":
    case "pop_stack":
      return typeof x.nodeId === "string";
    case "highlight_edge":
      return typeof x.edgeId === "string";
    case "update_distance":
      return typeof x.nodeId === "string" && typeof x.distance === "number";
    case "set_note":
      return typeof x.text === "string";
    default:
      return false;
  }
}

function validStep(x: unknown): x is GraphVisualStep {
  if (!isRecord(x)) return false;
  if (typeof x.id !== "string" || typeof x.title !== "string") return false;
  if (typeof x.narration !== "string" || typeof x.subtitle !== "string") return false;
  if (!Array.isArray(x.actions)) return false;
  return x.actions.every(validAction);
}

export function isValidGraphVisualSlide(v: unknown): v is GraphVisualSlide {
  if (!isRecord(v) || v.kind !== "graph") return false;
  if (
    typeof v.algorithm !== "string" ||
    !["bfs", "dfs", "dijkstra", "generic"].includes(v.algorithm)
  ) {
    return false;
  }
  if (!isRecord(v.graph)) return false;
  const nodes = v.graph.nodes;
  const edges = v.graph.edges;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return false;
  if (!nodes.every(validNode) || !edges.every(validEdge)) return false;
  if (!Array.isArray(v.steps) || !v.steps.every(validStep)) return false;
  return true;
}

export function isValidVisualSlide(v: unknown): v is VisualSlide {
  if (!isRecord(v) || typeof v.kind !== "string") return false;
  if (v.kind === "graph") return isValidGraphVisualSlide(v);
  if (v.kind === "diagram") return true;
  if (v.kind === "equation") return true;
  return false;
}
