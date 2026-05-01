import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Globe2,
  Layers,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { HeroSection } from "@/components/landing/HeroSection";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="bg-background">
      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">The problem</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Students often search across videos, search results, lecture notes, and AI
              chatbots but still feel confused because information is scattered and
              not organized into one trustworthy study path.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">The solution</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Edugen retrieves real resources, structures the topic into a learning
              blueprint, and generates slides, narration, examples, and practice —
              with citations so you can verify what you read.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Built for real studying
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Globe2}
              title="Real resource retrieval"
              description="Uses your search API (e.g. Tavily) — no fake URLs or canned snippets."
            />
            <FeatureCard
              icon={Layers}
              title="Personalized learning blueprint"
              description="Prerequisites, concept path, mistakes, and recap tailored to your goal."
            />
            <FeatureCard
              icon={Sparkles}
              title="Auto-generated slide deck"
              description="5–8 slides with bullets, visuals ideas, and speaker notes."
            />
            <FeatureCard
              icon={Mic}
              title="Slide video & subtitles"
              description="Subtitle scripts per slide, speech preview, and optional MP4 generation with narration."
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Practice questions with feedback"
              description="Multiple choice and short answer with explanations and review cues."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Citations and source transparency"
              description="See which retrieved sources grounded each part of your lesson."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          How the workflow fits together
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Input confusion → Fetch resources → Build lesson → Generate slides → Practice
        </p>
        <div className="mt-12">
          <WorkflowSteps />
        </div>
      </section>

      <section className="border-t border-border bg-gradient-to-b from-accent/30 to-background px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Start learning smarter
          </h2>
          <p className="mt-3 text-muted-foreground">
            Create a micro-lesson in minutes — grounded in real sources you select.
          </p>
          <Link href="/create" className="mt-8 inline-block">
            <Button size="lg">Create a Micro-Lesson</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground md:px-6">
        <p>
          Edugen is a study support tool. It may make mistakes. Always verify
          important information with your instructor, textbook, or cited sources.
        </p>
      </footer>
    </div>
  );
}
