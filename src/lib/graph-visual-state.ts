import type {
  GraphVisualAction,
  GraphVisualSlide,
  GraphVisualStep,
} from "@/types/visual-slide";

/** Mutable accumulator while replaying steps (internal). */
interface MutableGraphState {
  currentNodeId?: string;
  highlightedNodeIds: Set<string>;
  visitedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  queue: string[];
  stack: string[];
  distances: Record<string, number>;
  note?: string;
}

export interface DerivedGraphVisualState {
  currentNodeId?: string;
  highlightedNodeIds: Set<string>;
  visitedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  queue: string[];
  stack: string[];
  distances: Record<string, number>;
  note?: string;
}

function cloneDerived(m: MutableGraphState): DerivedGraphVisualState {
  return {
    currentNodeId: m.currentNodeId,
    highlightedNodeIds: new Set(m.highlightedNodeIds),
    visitedNodeIds: new Set(m.visitedNodeIds),
    highlightedEdgeIds: new Set(m.highlightedEdgeIds),
    queue: [...m.queue],
    stack: [...m.stack],
    distances: { ...m.distances },
    note: m.note,
  };
}

function emptyMutable(): MutableGraphState {
  return {
    highlightedNodeIds: new Set(),
    visitedNodeIds: new Set(),
    highlightedEdgeIds: new Set(),
    queue: [],
    stack: [],
    distances: {},
  };
}

function applyAction(state: MutableGraphState, action: GraphVisualAction): void {
  switch (action.type) {
    case "highlight_node":
      state.highlightedNodeIds.add(action.nodeId);
      break;
    case "highlight_edge":
      state.highlightedEdgeIds.add(action.edgeId);
      break;
    case "mark_visited":
      state.visitedNodeIds.add(action.nodeId);
      break;
    case "mark_current":
      state.currentNodeId = action.nodeId;
      break;
    case "enqueue":
      state.queue.push(action.nodeId);
      break;
    case "dequeue": {
      const q = state.queue;
      if (q.length === 0) break;
      if (q[0] === action.nodeId) {
        q.shift();
      } else {
        const ix = q.indexOf(action.nodeId);
        if (ix >= 0) q.splice(ix, 1);
      }
      break;
    }
    case "push_stack":
      state.stack.push(action.nodeId);
      break;
    case "pop_stack": {
      const st = state.stack;
      if (st.length === 0) break;
      const last = st[st.length - 1];
      if (last === action.nodeId) {
        st.pop();
      } else {
        const ix = st.lastIndexOf(action.nodeId);
        if (ix >= 0) st.splice(ix, 1);
      }
      break;
    }
    case "update_distance":
      state.distances[action.nodeId] = action.distance;
      break;
    case "set_note":
      state.note = action.text;
      break;
    default:
      break;
  }
}

function applyStepActions(state: MutableGraphState, step: GraphVisualStep): void {
  state.highlightedNodeIds.clear();
  state.highlightedEdgeIds.clear();
  state.note = undefined;
  state.currentNodeId = undefined;

  for (const action of step.actions) {
    applyAction(state, action);
  }
}

/**
 * Replay actions from step 0 through `currentStepIndex` so Previous works correctly.
 */
export function deriveGraphVisualState(
  steps: GraphVisualStep[],
  currentStepIndex: number
): DerivedGraphVisualState {
  const state = emptyMutable();
  const max = Math.min(currentStepIndex, Math.max(0, steps.length - 1));
  if (steps.length === 0) {
    return cloneDerived(state);
  }
  for (let s = 0; s <= max; s++) {
    const step = steps[s];
    if (step) applyStepActions(state, step);
  }
  return cloneDerived(state);
}

export function countGraphSteps(visual: GraphVisualSlide): number {
  return visual.steps?.length ?? 0;
}
