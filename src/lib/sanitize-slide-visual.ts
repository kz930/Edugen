import type { SlideContent } from "@/types/lesson";
import { isValidGraphVisualSlide, isValidVisualSlide } from "@/lib/validate-visual-slide";
import type {
  GraphVisualAction,
  GraphVisualSlide,
  VisualSlide,
} from "@/types/visual-slide";

/** Pedagogy: keep graphs teachable; trim oversized graphs from the model. */
const MAX_GRAPH_NODES = 7;

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function repairAction(x: unknown): GraphVisualAction | null {
  if (!isRecord(x) || typeof x.type !== "string") return null;
  const t = x.type;
  const nid = typeof x.nodeId === "string" ? x.nodeId : String(x.nodeId ?? "");
  const eid = typeof x.edgeId === "string" ? x.edgeId : String(x.edgeId ?? "");
  const txt = typeof x.text === "string" ? x.text : String(x.text ?? "");
  switch (t) {
    case "highlight_node":
    case "mark_visited":
    case "mark_current":
    case "enqueue":
    case "dequeue":
    case "push_stack":
    case "pop_stack":
      return nid ? { type: t, nodeId: nid } : null;
    case "highlight_edge":
      return eid ? { type: t, edgeId: eid } : null;
    case "update_distance": {
      const d = x.distance;
      const dist =
        typeof d === "number" && Number.isFinite(d)
          ? d
          : typeof d === "string"
            ? Number(d)
            : NaN;
      return nid && Number.isFinite(dist)
        ? { type: t, nodeId: nid, distance: dist }
        : null;
    }
    case "set_note":
      return txt ? { type: t, text: txt } : null;
    default:
      return null;
  }
}

function repairGraphVisual(raw: unknown): GraphVisualSlide | null {
  if (!isRecord(raw) || raw.kind !== "graph") return null;

  const algoRaw = typeof raw.algorithm === "string" ? raw.algorithm.toLowerCase() : "generic";
  const algorithm =
    algoRaw === "bfs" || algoRaw === "dfs" || algoRaw === "dijkstra" || algoRaw === "generic"
      ? algoRaw
      : "generic";

  const graphRaw = raw.graph;
  if (!isRecord(graphRaw)) return null;

  const nodesUnknown: unknown = graphRaw.nodes;
  const edgesUnknown: unknown = graphRaw.edges;
  const nodesList: unknown[] = Array.isArray(nodesUnknown) ? nodesUnknown : [];
  const edgesList: unknown[] = Array.isArray(edgesUnknown) ? edgesUnknown : [];

  const nodes = nodesList
    .map((n) => {
      if (!isRecord(n)) return null;
      const id = String(n.id ?? "").trim();
      if (!id) return null;
      const label = String(n.label ?? id).trim() || id;
      return { id, label };
    })
    .filter(Boolean) as { id: string; label: string }[];

  if (nodes.length === 0) return null;

  let trimmed = nodes;
  if (nodes.length > MAX_GRAPH_NODES) {
    console.warn(
      `[sanitize-slide-visual] Graph had ${nodes.length} nodes; keeping first ${MAX_GRAPH_NODES} for teachability.`
    );
    trimmed = nodes.slice(0, MAX_GRAPH_NODES);
  }
  const nodeIds = new Set(trimmed.map((n) => n.id));

  const edges = edgesList
    .map((e) => {
      if (!isRecord(e)) return null;
      const id = String(e.id ?? "").trim();
      const source = String(e.source ?? "").trim();
      const target = String(e.target ?? "").trim();
      if (!id || !source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
        return null;
      }
      const edge: {
        id: string;
        source: string;
        target: string;
        label?: string;
        weight?: number;
        directed?: boolean;
      } = { id, source, target };
      if (e.label != null && String(e.label).trim()) edge.label = String(e.label);
      if (typeof e.weight === "number" && Number.isFinite(e.weight)) edge.weight = e.weight;
      else if (typeof e.weight === "string") {
        const w = Number(e.weight);
        if (Number.isFinite(w)) edge.weight = w;
      }
      if (typeof e.directed === "boolean") edge.directed = e.directed;
      return edge;
    })
    .filter(Boolean) as GraphVisualSlide["graph"]["edges"];

  const stepsRaw = raw.steps;
  if (!Array.isArray(stepsRaw)) return null;

  const steps = stepsRaw
    .map((st, idx) => {
      if (!isRecord(st)) return null;
      const id = String(st.id ?? `step-${idx + 1}`).trim() || `step-${idx + 1}`;
      const title = String(st.title ?? `Step ${idx + 1}`).trim();
      const narration = String(st.narration ?? "").trim();
      let subtitle = String(st.subtitle ?? "").trim();
      if (!subtitle && title) subtitle = title;
      const actionsRaw = st.actions;
      const actions: GraphVisualAction[] = Array.isArray(actionsRaw)
        ? (actionsRaw.map(repairAction).filter(Boolean) as GraphVisualAction[])
        : [];
      if (!narration || !subtitle) return null;
      return { id, title, narration, subtitle, actions };
    })
    .filter(Boolean) as GraphVisualSlide["steps"];

  if (steps.length === 0) return null;

  const out: GraphVisualSlide = {
    kind: "graph",
    algorithm,
    graph: { nodes: trimmed, edges },
    steps,
  };

  return isValidGraphVisualSlide(out) ? out : null;
}

function repairDiagramVisual(raw: unknown): VisualSlide | null {
  if (!isRecord(raw) || raw.kind !== "diagram") return null;
  const out: VisualSlide = {
    kind: "diagram",
    title:
      typeof raw.title === "string" ? raw.title : raw.title != null ? String(raw.title) : undefined,
    description:
      typeof raw.description === "string"
        ? raw.description
        : raw.description != null
          ? String(raw.description)
          : undefined,
  };
  return out.kind === "diagram" ? out : null;
}

function repairEquationVisual(raw: unknown): VisualSlide | null {
  if (!isRecord(raw) || raw.kind !== "equation") return null;
  const out: VisualSlide = {
    kind: "equation",
    title:
      typeof raw.title === "string" ? raw.title : raw.title != null ? String(raw.title) : undefined,
    expression:
      typeof raw.expression === "string"
        ? raw.expression
        : raw.expression != null
          ? String(raw.expression)
          : undefined,
    desmosExpression:
      typeof raw.desmosExpression === "string"
        ? raw.desmosExpression
        : raw.desmosExpression != null
          ? String(raw.desmosExpression)
          : undefined,
  };
  return out.kind === "equation" ? out : null;
}

/**
 * Attempt to coerce LLM output into a valid `visual`; returns null if unusable.
 */
export function tryRepairVisual(raw: unknown): VisualSlide | null {
  if (raw == null) return null;
  if (!isRecord(raw) || typeof raw.kind !== "string") return null;

  if (raw.kind === "graph") {
    return repairGraphVisual(raw);
  }
  if (raw.kind === "diagram") {
    const d = repairDiagramVisual(raw);
    return d && isValidVisualSlide(d) ? d : null;
  }
  if (raw.kind === "equation") {
    const e = repairEquationVisual(raw);
    return e && isValidVisualSlide(e) ? e : null;
  }
  return null;
}

/**
 * Keeps or repairs `slide.visual`; removes invalid visuals so the lesson never crashes.
 */
export function sanitizeSlideVisual(slide: SlideContent, context?: string): SlideContent {
  const ctx = context ?? "slide";
  if (slide.visual == null) return slide;

  const raw = slide.visual as unknown;
  if (isValidVisualSlide(raw)) {
    return slide;
  }

  const repaired = tryRepairVisual(raw);
  if (repaired && isValidVisualSlide(repaired)) {
    if (!isValidVisualSlide(raw)) {
      console.warn(`[${ctx}] visual JSON was repaired (coerced/trimmed).`);
    }
    return { ...slide, visual: repaired };
  }

  console.warn(
    `[${ctx}] invalid or unrepaired "visual" field removed (storyboard could not be validated).`
  );
  const out = { ...slide };
  delete out.visual;
  return out;
}
