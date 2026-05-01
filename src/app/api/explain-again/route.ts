import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY required." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const concept = String(body.concept ?? "");
    const lessonContext = String(body.lessonContext ?? "").slice(0, 6000);

    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Explain the concept again in simpler language for a student. 2-4 short paragraphs max.",
        },
        {
          role: "user",
          content: `Concept to clarify: ${concept}\n\nLesson context:\n${lessonContext}`,
        },
      ],
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ explanation: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
