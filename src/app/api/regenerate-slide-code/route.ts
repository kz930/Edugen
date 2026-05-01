import OpenAI from "openai";
import { NextResponse } from "next/server";
import { looksLikeCode } from "@/lib/slide-code-snippet";

export const runtime = "nodejs";

function stripFences(s: string): string {
  return s
    .replace(/^```\w*\r?\n?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

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
    const description = String(body.description ?? "").trim();
    if (!description) {
      return NextResponse.json(
        { error: "description is required." },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Generate the actual Python code for: ${description}
Return ONLY the code, no explanation, no markdown fences.`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty LLM response." },
        { status: 502 }
      );
    }

    const code = stripFences(raw.trim());
    if (!looksLikeCode(code)) {
      return NextResponse.json(
        {
          error:
            "Model did not return plausible code. Try editing the description or retry.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ code });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
