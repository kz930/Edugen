import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">How Edugen works</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Edugen helps students who feel stuck by turning <strong className="text-foreground">your topic</strong>,{" "}
          <strong className="text-foreground">real search results</strong>, and{" "}
          <strong className="text-foreground">your notes</strong> into a structured micro-lesson.
        </p>
        <p>
          When you enable online search, Edugen calls a configured API (such as Tavily) so titles,
          URLs, and snippets come from the live web — not simulated cards.
        </p>
        <p>
          The lesson blueprint organizes prerequisites, key terms, and common mistakes. Slides and
          narration scripts help you rehearse. Practice questions include feedback; short answers can be
          graded with your OpenAI key.
        </p>
        <p>
          <strong className="text-foreground">Edugen is not a replacement for teachers.</strong> Use it
          alongside class instruction and textbooks. Always double-check facts against cited sources.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/create">
          <Button>Create a lesson</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Back home</Button>
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">
        Regulatory note: Generated content may contain errors. Verify critical information with trusted
        materials and instructors.
      </p>
    </div>
  );
}
