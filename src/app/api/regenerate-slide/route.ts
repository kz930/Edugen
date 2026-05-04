import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { RetrievedSource, SlideContent } from "@/types/lesson";
import { sanitizeSlideContent } from "@/lib/slide-code-snippet";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY required for regeneration." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const slideNumber = Number(body.slideNumber);
    const topic = String(body.topic ?? "");
    const lessonTitle = String(body.lessonTitle ?? "");
    const selectedSources = (body.selectedSources ?? []) as RetrievedSource[];
    const uploadedText = String(body.uploadedText ?? "").slice(0, 8000);

    const srcContext = selectedSources
      .map((s) => `[${s.id}] ${s.snippet}`)
      .join("\n");

    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You revise one lesson slide. Output JSON matching SlideContent shape only.
If the slide needs code, put the actual source in "codeSnippet" (raw code with \\n newlines). Never use a sentence like "Code snippet of…" — only real runnable code.
Optional fields: "codeSnippet" (string), "contentType" ("bullets"|"code"|"diagram"|"mixed").
Regenerate this slide and include a "visual" visual storyboard when the concept is algorithmic, spatial, mathematical, or process-based. For graph algorithms (BFS/DFS/Dijkstra): small graph (about 5–7 nodes), full nodes/edges/steps; each step needs title, narration, and a subtitle that states exactly what changed visually; narration must match that step's actions (queue/stack/visited/distances). Omit "visual" only when text-only is clearer.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}\nLesson: ${lessonTitle}\nSlide number: ${slideNumber}\nNotes:\n${uploadedText}\nSources:\n${srcContext}\nReturn JSON: {"slideNumber": number, "title": string, "mainIdea": string, "bullets": string[], "visualSuggestion": string, "speakerNotes": string, "sourceIds": string[], "codeSnippet"?: string, "contentType"?: string, "visual"?: object}`,
        },
      ],
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty LLM response." }, { status: 502 });
    }

    const slide = sanitizeSlideContent(
      JSON.parse(raw) as SlideContent,
      `regenerate slide ${slideNumber}`
    );
    slide.slideNumber = slideNumber;

    return NextResponse.json({ slide });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
