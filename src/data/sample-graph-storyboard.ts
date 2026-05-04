import type { LessonRecord } from "@/types/lesson";
import type { GraphVisualSlide } from "@/types/visual-slide";

/** Same undirected shape for demos: A—B, A—C, B—D, B—E, C—F */
export const DEMO_GRAPH_BASE = {
  nodes: [
    { id: "A", label: "A" },
    { id: "B", label: "B" },
    { id: "C", label: "C" },
    { id: "D", label: "D" },
    { id: "E", label: "E" },
    { id: "F", label: "F" },
  ],
  edges: [
    { id: "e_AB", source: "A", target: "B", directed: false },
    { id: "e_AC", source: "A", target: "C", directed: false },
    { id: "e_BD", source: "B", target: "D", directed: false },
    { id: "e_BE", source: "B", target: "E", directed: false },
    { id: "e_CF", source: "C", target: "F", directed: false },
  ],
} as const;

export const BFS_TREE_VISUAL: GraphVisualSlide = {
  kind: "graph",
  algorithm: "bfs",
  graph: {
    nodes: [...DEMO_GRAPH_BASE.nodes],
    edges: [...DEMO_GRAPH_BASE.edges],
  },
  steps: [
    {
      id: "s1",
      title: "Initialize from the source",
      narration:
        "Breadth-first search starts at the source vertex. We place A on the queue so we can visit its neighbors in FIFO order.",
      subtitle:
        "A becomes the first node in the queue; nothing has been visited yet.",
      actions: [
        { type: "mark_current", nodeId: "A" },
        { type: "enqueue", nodeId: "A" },
        { type: "set_note", text: "Queue: [A]" },
      ],
    },
    {
      id: "s2",
      title: "Visit A and expand neighbors",
      narration:
        "We dequeue A, mark it visited, then enqueue every neighbor that has not been seen. Neighbors B and C join the back of the queue.",
      subtitle:
        "A is removed from the queue, marked visited, and its unvisited neighbors B and C are appended — queue becomes [B, C].",
      actions: [
        { type: "dequeue", nodeId: "A" },
        { type: "mark_visited", nodeId: "A" },
        { type: "highlight_edge", edgeId: "e_AB" },
        { type: "highlight_edge", edgeId: "e_AC" },
        { type: "enqueue", nodeId: "B" },
        { type: "enqueue", nodeId: "C" },
        { type: "set_note", text: "Queue: [B, C]" },
      ],
    },
    {
      id: "s3",
      title: "Process B before C (FIFO)",
      narration:
        "The queue is FIFO: B is next. Dequeue B, mark it visited, then enqueue its unseen neighbors D and E.",
      subtitle:
        "B is popped from the front; D and E are discovered along edges from B and appended — queue [C, D, E].",
      actions: [
        { type: "mark_current", nodeId: "B" },
        { type: "dequeue", nodeId: "B" },
        { type: "mark_visited", nodeId: "B" },
        { type: "highlight_edge", edgeId: "e_BD" },
        { type: "highlight_edge", edgeId: "e_BE" },
        { type: "enqueue", nodeId: "D" },
        { type: "enqueue", nodeId: "E" },
        { type: "set_note", text: "Queue: [C, D, E]" },
      ],
    },
    {
      id: "s4",
      title: "Process C",
      narration:
        "C is at the front of the queue. After visiting C we enqueue its neighbor F.",
      subtitle:
        "C leaves the queue; F is the only new neighbor — queue becomes [D, E, F].",
      actions: [
        { type: "dequeue", nodeId: "C" },
        { type: "mark_visited", nodeId: "C" },
        { type: "highlight_edge", edgeId: "e_CF" },
        { type: "enqueue", nodeId: "F" },
        { type: "set_note", text: "Queue: [D, E, F]" },
      ],
    },
    {
      id: "s5",
      title: "Visit D",
      narration: "D has no unvisited neighbors; dequeue and mark visited.",
      subtitle: "D is removed from the front; queue shrinks to [E, F].",
      actions: [
        { type: "dequeue", nodeId: "D" },
        { type: "mark_visited", nodeId: "D" },
        { type: "set_note", text: "Queue: [E, F]" },
      ],
    },
    {
      id: "s6",
      title: "Visit E",
      narration: "E is processed the same way.",
      subtitle: "E is dequeued and marked visited — queue [F].",
      actions: [
        { type: "dequeue", nodeId: "E" },
        { type: "mark_visited", nodeId: "E" },
        { type: "set_note", text: "Queue: [F]" },
      ],
    },
    {
      id: "s7",
      title: "Finish at F",
      narration:
        "The last node leaves the queue. Breadth-first traversal order matches layers radiating from A.",
      subtitle:
        "F is dequeued and visited. BFS order with this neighbor ordering is A, B, C, D, E, F.",
      actions: [
        { type: "dequeue", nodeId: "F" },
        { type: "mark_visited", nodeId: "F" },
        {
          type: "set_note",
          text: "Traversal order: A → B → C → D → E → F",
        },
      ],
    },
  ],
};

/** DFS with neighbor order A→B before C, etc. Order: A, B, D, E, C, F */
export const DFS_TREE_VISUAL: GraphVisualSlide = {
  kind: "graph",
  algorithm: "dfs",
  graph: {
    nodes: [...DEMO_GRAPH_BASE.nodes],
    edges: [...DEMO_GRAPH_BASE.edges],
  },
  steps: [
    {
      id: "d1",
      title: "Start DFS at A",
      narration: "We push the start node and explore as deep as possible before backtracking.",
      subtitle: "Stack: [A]; we will visit A first.",
      actions: [
        { type: "mark_current", nodeId: "A" },
        { type: "push_stack", nodeId: "A" },
        { type: "set_note", text: "Stack top: A" },
      ],
    },
    {
      id: "d2",
      title: "Visit A, go to B",
      narration:
        "Mark A visited; choose neighbor B first (typical left-to-right ordering). Push B to continue deeper.",
      subtitle:
        "A is visited; edge A–B is taken next — stack reflects the recursive dive toward B.",
      actions: [
        { type: "mark_visited", nodeId: "A" },
        { type: "highlight_edge", edgeId: "e_AB" },
        { type: "mark_current", nodeId: "B" },
        { type: "push_stack", nodeId: "B" },
      ],
    },
    {
      id: "d3",
      title: "Deepen to D",
      narration: "From B we immediately visit D before returning to other branches.",
      subtitle: "Edge B–D is traversed; D will be visited before E because we go deep first.",
      actions: [
        { type: "mark_visited", nodeId: "B" },
        { type: "highlight_edge", edgeId: "e_BD" },
        { type: "mark_current", nodeId: "D" },
        { type: "push_stack", nodeId: "D" },
      ],
    },
    {
      id: "d4",
      title: "Dead end at D — backtrack",
      narration: "D has no unvisited neighbors; pop and return control to B.",
      subtitle: "D is marked visited; stack pops back so we can try the next edge from B.",
      actions: [
        { type: "mark_visited", nodeId: "D" },
        { type: "pop_stack", nodeId: "D" },
      ],
    },
    {
      id: "d5",
      title: "Visit E from B",
      narration: "After D, the next neighbor of B is E.",
      subtitle: "Traverse B–E; E is a leaf in this subgraph — stack records the return path.",
      actions: [
        { type: "highlight_edge", edgeId: "e_BE" },
        { type: "mark_current", nodeId: "E" },
        { type: "push_stack", nodeId: "E" },
        { type: "mark_visited", nodeId: "E" },
        { type: "pop_stack", nodeId: "E" },
      ],
    },
    {
      id: "d6",
      title: "Backtrack to A, then explore C",
      narration:
        "Finished B’s subtree; pop back to A and take the next neighbor C.",
      subtitle: "Stack unwinds to A, then edge A–C leads to the remaining branch.",
      actions: [
        { type: "pop_stack", nodeId: "B" },
        { type: "highlight_edge", edgeId: "e_AC" },
        { type: "mark_current", nodeId: "C" },
        { type: "push_stack", nodeId: "C" },
      ],
    },
    {
      id: "d7",
      title: "Finish branch at F",
      narration: "Visit F from C. DFS order with this ordering is A, B, D, E, C, F.",
      subtitle:
        "C is visited, then F; traversal completes. Final DFS order: A → B → D → E → C → F.",
      actions: [
        { type: "mark_visited", nodeId: "C" },
        { type: "highlight_edge", edgeId: "e_CF" },
        { type: "mark_visited", nodeId: "F" },
        {
          type: "set_note",
          text: "DFS order: A → B → D → E → C → F",
        },
      ],
    },
  ],
};

export function createBfsDemoLessonRecord(): LessonRecord {
  const slide = {
    slideNumber: 1,
    title: "Breadth-first search on a small graph",
    mainIdea:
      "BFS explores vertices in layers using a queue: visit the source, then all neighbors at distance 1, then distance 2, and so on.",
    bullets: [
      "Queue enforces FIFO — shallow nodes finish before deeper ones.",
      "Each vertex is visited once; neighbors enter at the tail.",
      "Works for unweighted shortest path on unweighted graphs.",
    ],
    visualSuggestion: "",
    speakerNotes:
      "Use the step controls to narrate along with queue changes. Emphasize FIFO vs DFS’s LIFO/recursion.",
    sourceIds: [],
    visual: BFS_TREE_VISUAL,
  };
  const narrationScript = BFS_TREE_VISUAL.steps.map((s) => s.narration).join(" ");
  return {
    id: "demo-visual-bfs",
    createdAt: new Date().toISOString(),
    topic: "BFS visualization demo",
    subject: "Computer Science",
    level: "College Intro",
    learningGoal: "Explain from scratch",
    explanationStyle: "Step-by-step",
    sources: [],
    uploadedText: "",
    selectedSourceIds: [],
    lessonData: {
      lessonTitle: "BFS visual storyboard (demo)",
      overview: {
        summary: "Interactive queue-driven traversal.",
        learningObjectives: ["See queue updates", "Relate edges to dequeue order"],
        estimatedTimeMinutes: 15,
      },
      blueprint: {
        prerequisites: [],
        keyTerms: [],
        conceptPath: [],
        commonMistakes: [],
        recap: [],
      },
      slides: [slide],
      narration: [
        {
          slideNumber: 1,
          script: narrationScript,
          estimatedDurationSeconds: 120,
        },
      ],
      practiceQuestions: [],
      sourcesUsed: [],
    },
  };
}

export function createDfsDemoLessonRecord(): LessonRecord {
  const slide = {
    slideNumber: 1,
    title: "Depth-first search on the same graph",
    mainIdea:
      "DFS explores one branch fully (stack / recursion) before siblings. Order depends on adjacency ordering.",
    bullets: [
      "Stack or recursion captures the “go deep, then backtrack” pattern.",
      "Visited set prevents cycles on graphs with back-edges.",
      "Same graph as BFS — compare traversal order.",
    ],
    visualSuggestion: "",
    speakerNotes: "Contrast stack discipline with the BFS demo’s queue.",
    sourceIds: [],
    visual: DFS_TREE_VISUAL,
  };
  const narrationScript = DFS_TREE_VISUAL.steps.map((s) => s.narration).join(" ");
  return {
    id: "demo-visual-dfs",
    createdAt: new Date().toISOString(),
    topic: "DFS visualization demo",
    subject: "Computer Science",
    level: "College Intro",
    learningGoal: "Explain from scratch",
    explanationStyle: "Step-by-step",
    sources: [],
    uploadedText: "",
    selectedSourceIds: [],
    lessonData: {
      lessonTitle: "DFS visual storyboard (demo)",
      overview: {
        summary: "Interactive stack-driven traversal.",
        learningObjectives: ["Contrast DFS with BFS"],
        estimatedTimeMinutes: 15,
      },
      blueprint: {
        prerequisites: [],
        keyTerms: [],
        conceptPath: [],
        commonMistakes: [],
        recap: [],
      },
      slides: [slide],
      narration: [
        {
          slideNumber: 1,
          script: narrationScript,
          estimatedDurationSeconds: 120,
        },
      ],
      practiceQuestions: [],
      sourcesUsed: [],
    },
  };
}
