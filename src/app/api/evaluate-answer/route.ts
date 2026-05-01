import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = String(body.question ?? "");
    const correctAnswer = String(body.correctAnswer ?? "");
    const studentAnswer = String(body.studentAnswer ?? "");
    const lessonContext = String(body.lessonContext ?? "");
    const type = String(body.type ?? "short_answer");

    if (!question || !studentAnswer) {
      return NextResponse.json(
        { error: "question and studentAnswer are required." },
        { status: 400 }
      );
    }

    if (type === "multiple_choice") {
      const ok =
        normalize(studentAnswer) === normalize(correctAnswer) ||
        studentAnswer.trim() === correctAnswer.trim();
      return NextResponse.json({
        isCorrect: ok,
        score: ok ? 1 : 0,
        feedback: ok
          ? "Correct."
          : `Not quite. The best choice was: ${correctAnswer}`,
        conceptToReview: ok ? undefined : "Review the related slide and summary.",
        simplerExplanation: ok ? undefined : undefined,
      });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json(
        {
          error:
            "Short-answer grading requires OPENAI_API_KEY in .env.local.",
        },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You grade short student answers. Return JSON: {"isCorrect": boolean, "score": number 0-1, "feedback": string, "conceptToReview": string, "simplerExplanation": string}. Be fair; accept paraphrases that show understanding.',
        },
        {
          role: "user",
          content: `Lesson context (brief):\n${lessonContext.slice(0, 4000)}\n\nQuestion: ${question}\nExpected answer key: ${correctAnswer}\nStudent answer: ${studentAnswer}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Evaluation failed (empty response)." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw) as {
      isCorrect?: boolean;
      score?: number;
      feedback?: string;
      conceptToReview?: string;
      simplerExplanation?: string;
    };

    return NextResponse.json({
      isCorrect: Boolean(parsed.isCorrect),
      score: typeof parsed.score === "number" ? parsed.score : parsed.isCorrect ? 1 : 0,
      feedback: parsed.feedback ?? "",
      conceptToReview: parsed.conceptToReview ?? "",
      simplerExplanation: parsed.simplerExplanation ?? "",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
