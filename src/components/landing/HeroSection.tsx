import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/40 to-background px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
          Confusion → micro-lesson
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Turn confusion into personalized slides, videos, and practice.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Edugen helps students transform difficult concepts into structured
          micro-lessons using trusted resources, class materials, AI-generated
          slides, narration, and practice questions.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" className="gap-2">
              Create a Micro-Lesson
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
