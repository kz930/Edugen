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
  The codeSnippet field must always contain valid, runnable code when present. You may still include a markdown code fence inside visualSuggestion for Mermaid or alternate formatting, but codeSnippet must hold the raw source when the slide teaches code.`;

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
