import { createRequire } from "module";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (data: Buffer) => Promise<{ text?: string }>;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const name = "name" in file && typeof file.name === "string" ? file.name : "upload";
    const lower = name.toLowerCase();

    const buf = Buffer.from(await file.arrayBuffer());

    if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      const text = buf.toString("utf-8");
      return NextResponse.json({ text, format: "text" });
    }

    if (lower.endsWith(".pdf")) {
      try {
        const parsed = await pdfParse(buf);
        const text = parsed.text?.trim() ?? "";
        if (!text) {
          return NextResponse.json(
            {
              error:
                "Could not extract text from this PDF (it may be scanned images). Upload .txt/.md or paste notes.",
            },
            { status: 422 }
          );
        }
        return NextResponse.json({ text: text.slice(0, 50000), format: "pdf" });
      } catch (e) {
        console.error(e);
        return NextResponse.json(
          {
            error:
              "PDF parsing failed. Please upload .txt or .md, or paste your notes.",
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Unsupported file type. Use .txt, .md, or .pdf.",
      },
      { status: 400 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload processing failed." }, { status: 500 });
  }
}
