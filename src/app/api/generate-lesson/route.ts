import OpenAI from "openai";
import { NextResponse } from "next/server";
import type {
  CourseLevel,
  ExplanationStyle,
  GeneratedLessonData,
  LearningGoal,
  RetrievedSource,
  Subject,
} from "@/types/lesson";
import { sanitizeLessonSlides } from "@/lib/slide-code-snippet";

export const runtime = "nodejs";

const SYSTEM = `You are Edugen, an expert educator. You MUST output valid JSON only, matching the user's schema.
Rules:
- Base explanations ONLY on the provided source snippets and uploaded notes. Do not invent URLs or source ids.
- In slides and narration, cite sources using the exact source "id" strings provided in context when that source informed content.
- sourcesUsed must be a subset of those ids you actually relied on.
- Slides: produce between 5 and 8 slides unless output options restrict slides (if slides disabled, still include minimal structure — follow outputOptions).
- Practice: exactly 5 questions, mix multiple_choice and short_answer.
- Use clear, accurate pedagogy for the stated course level and explanation style.
- If information is insufficient, say so briefly in overview.summary rather than inventing facts.
- If a slide requires a code example, you MUST include the actual code in the codeSnippet field. Never put a description like "code snippet of X" — put the real working code. For example:
  BAD:  "codeSnippet": "Code snippet of a factorial function in Python"
  GOOD: "codeSnippet": "def factorial(n):\\n    if n == 0:\\n        return 1\\n    return n * factorial(n - 1)"
  The codeSnippet field must always contain valid, runnable code when present. You may still include a markdown code fence inside visualSuggestion for Mermaid or alternate formatting, but codeSnippet must hold the raw source when the slide teaches code.

NARRATION SCRIPTS ("narration": [{ "slideNumber", "script", "estimatedDurationSeconds" }]) — MUST match what appears on that slide in the video:
- Scripts are read aloud verbatim and shown as subtitles (split by sentences). They must describe exactly what the learner sees on that slide at that moment — not a generic course intro.
- If the slide has slide.visual with kind "graph": the script MUST walk through the SAME graph storyboard as visual.steps. Explain each phase in order: name nodes and edges by label, say how the queue/stack/priority queue evolves, call out relaxations and distance updates with the numbers shown. Do NOT write a vague overview ("here we visualize a graph") while the animation shows Dijkstra/BFS steps — the learner must hear the same progression as visual.steps[].narration (you may merge steps into flowing prose, but content must be concrete and algorithm-specific).
- If the slide has codeSnippet (real code): the script MUST walk through that code in execution order — initialize structure, main loop, relaxation/update, termination. Reference real identifiers from the snippet (function names, heapq, distances dict, etc.) so subtitles align with the code listing.
- Otherwise: tie clearly to bullets and mainIdea.

VISUALIZATION — WHEN TO SET slide.visual:
Detect topics that need animated or structured visuals (not plain text). Include slide.visual when teaching any of:
- Graph algorithms: BFS, DFS, Dijkstra, other traversals on graphs/trees
- Graphs and trees (structure, traversal order)
- Recursion (call stack / recursion tree when helpful)
- Sorting algorithms (comparisons, partitions, invariant snapshots)
- Linked lists (pointer/reassignment steps)
- Dynamic programming (table filling, state transitions)
- Finite state machines / automata (states and transitions)
- Probability trees, decision trees
- Geometry (figures, constructions when steppable)
- Linear algebra (vectors, transformations — equation visual or diagram description)
- System design / pipelines / flows (diagram kind)

If the slide is purely conceptual prose with no steppable visual, omit "visual".

FOR EVERY slide.visual ON GRAPH ALGORITHMS (kind "graph"), ALL of the following are mandatory:
- graph.nodes and graph.edges (every edge id must connect existing node ids)
- When traversal starts from one vertex, make that clear in early steps (mark_current / enqueue / push_stack as appropriate)
- steps[]: every step must include id, title, narration, subtitle, and actions[]
- Every step MUST have a subtitle that states exactly what changed on screen (no vague lines like "BFS uses a queue" or "We continue traversing")
- Every step MUST have narration that describes the same moment as the actions (spoken explanation aligned with queue/stack/visited/distances)
- Surface algorithm state with actions: queue (BFS), stack or recursion path (DFS), visited via mark_visited, distances via update_distance (Dijkstra). Use set_note for traversal order summaries when helpful.

PEDAGOGY:
- Assume the learner has never seen the algorithm before: short titles, concrete subtitles, one main idea per step.
- Prefer SMALL graphs: typically 5–7 nodes unless the user explicitly needs more. Never output huge graphs.

ALGORITHM-SPECIFIC EMPHASIS:
- BFS: show queue front-to-back evolution clearly (enqueue/dequeue/mark_visited/highlight_edge for expansion).
- DFS: show stack pushes/pops OR recursion depth clearly; show backtracking when relevant.
- Dijkstra: weighted edges when needed; show current node, relaxations via update_distance, settled vs tentative clearly in narration/subtitles.

GRAPH JSON SHAPE (kind "graph"):
  "visual": {
    "kind": "graph",
    "algorithm": "bfs" | "dfs" | "dijkstra" | "generic",
    "graph": {
      "nodes": [{ "id": string, "label": string }],
      "edges": [{ "id": string, "source": string, "target": string, "label"?: string, "weight"?: number, "directed"?: boolean }]
    },
    "steps": [{
      "id": string,
      "title": string,
      "narration": string,
      "subtitle": string,
      "actions": [
        { "type": "highlight_node", "nodeId": string },
        { "type": "highlight_edge", "edgeId": string },
        { "type": "mark_visited", "nodeId": string },
        { "type": "mark_current", "nodeId": string },
        { "type": "enqueue", "nodeId": string },
        { "type": "dequeue", "nodeId": string },
        { "type": "push_stack", "nodeId": string },
        { "type": "pop_stack", "nodeId": string },
        { "type": "update_distance", "nodeId": string, "distance": number },
        { "type": "set_note", "text": string }
      ]
    }]
  }

OTHER VISUAL KINDS (when graph structure is not the main point):
- "diagram": { "kind": "diagram", "title"?: string, "description"?: string } — flows, high-level architecture, simple scenes
- "equation": { "kind": "equation", "expression"?: string, "desmosExpression"?: string } — key formulas

If a slide does not need a visual storyboard, omit "visual" entirely.`;

function buildUserPrompt(params: {
  topic: string;
  subject: Subject;
  level: CourseLevel;
  learningGoal: LearningGoal;
  explanationStyle: ExplanationStyle;
  selectedSources: RetrievedSource[];
  uploadedText: string;
  outputOptions: {
    slides: boolean;
    narration: boolean;
    practice: boolean;
    summary: boolean;
  };
}): string {
  const srcBlock = params.selectedSources
    .map(
      (s) =>
        `[${s.id}] (${s.domain}) ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}\n`
    )
    .join("\n");

  return `
Topic / confusion: ${params.topic}
Subject: ${params.subject}
Level: ${params.level}
Learning goal: ${params.learningGoal}
Explanation style: ${params.explanationStyle}

Output options (respect these):
- Include slides section: ${params.outputOptions.slides}
- Include narration scripts: ${params.outputOptions.narration}
- Include practice questions: ${params.outputOptions.practice}
- Include study summary in overview: ${params.outputOptions.summary}

Uploaded notes (may be empty):
${params.uploadedText.slice(0, 12000)}

Selected sources:
${srcBlock || "(none)"}

Before returning JSON, review slides whose topics appear in the VISUALIZATION list in SYSTEM: include a rich slide.visual with beginner-friendly steps; subtitles must be concrete (what moved, highlighted, enqueued, or updated — never generic); narration must match the same step's actions. Use at most ~7 nodes per graph unless the topic demands more.

Return JSON with this exact shape:
{
  "lessonTitle": string,
  "overview": { "summary": string, "learningObjectives": string[], "estimatedTimeMinutes": number },
  "blueprint": {
    "prerequisites": string[],
    "keyTerms": { "term": string, "definition": string }[],
    "conceptPath": string[],
    "commonMistakes": string[],
    "recap": string[],
    "coreConcept": string,
    "examplePlan": string[],
    "practiceGoals": string[]
  },
  "slides": [
    {
      "slideNumber": number,
      "title": string,
      "mainIdea": string,
      "bullets": string[],
      "visualSuggestion": string,
      "codeSnippet": string (optional; raw source code only, never a prose description),
      "contentType": "bullets" | "code" | "diagram" | "mixed" (optional),
      "visual": optional graph/diagram/equation visual storyboard (see SYSTEM instructions),
      "speakerNotes": string,
      "sourceIds": string[]
    }
  ],
  "narration": [
    { "slideNumber": number, "script": string, "estimatedDurationSeconds": number }
  ],
  "practiceQuestions": [
    {
      "id": string,
      "type": "multiple_choice" | "short_answer",
      "question": string,
      "choices": string[] | optional for short_answer,
      "correctAnswer": string,
      "explanation": string,
      "relatedSlideNumber": number
    }
  ],
  "sourcesUsed": string[]
}

If slides output is disabled, return slides as [] and narration as [].
If narration disabled, narration can be [].
If practice disabled, practiceQuestions can be [].
`;
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Lesson generation requires OPENAI_API_KEY in .env.local.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const topic = String(body.topic ?? "").trim();
    const subject = body.subject as Subject;
    const level = body.level as CourseLevel;
    const learningGoal = body.learningGoal as LearningGoal;
    const explanationStyle = body.explanationStyle as ExplanationStyle;
    const selectedSources = (body.selectedSources ?? []) as RetrievedSource[];
    const uploadedText = String(body.uploadedText ?? "");
    const outputOptions = body.outputOptions ?? {
      slides: true,
      narration: true,
      practice: true,
      summary: true,
    };

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: key });
    const prompt = buildUserPrompt({
      topic,
      subject,
      level,
      learningGoal,
      explanationStyle,
      selectedSources,
      uploadedText,
      outputOptions,
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "LLM generation failed (empty response)." },
        { status: 502 }
      );
    }

    let data: GeneratedLessonData;
    try {
      data = JSON.parse(raw) as GeneratedLessonData;
    } catch {
      return NextResponse.json(
        { error: "LLM returned invalid JSON." },
        { status: 502 }
      );
    }

    // Validate sourcesUsed ⊆ selected ids
    const allowed = new Set(selectedSources.map((s) => s.id));
    data.sourcesUsed = (data.sourcesUsed ?? []).filter((id) => allowed.has(id));

    data.slides = sanitizeLessonSlides(
      Array.isArray(data.slides) ? data.slides : []
    );

    return NextResponse.json({ lesson: data });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
