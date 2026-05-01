import { Search, Layers, Sparkles, ClipboardCheck } from "lucide-react";

const steps = [
  { icon: Search, title: "Describe what confuses you", desc: "Topic + goal + level" },
  { icon: Layers, title: "Fetch real resources", desc: "Ranked web & optional video" },
  { icon: Sparkles, title: "Build lesson & slides", desc: "Blueprint, narration, cites" },
  { icon: ClipboardCheck, title: "Practice & export", desc: "Questions with feedback" },
];

export function WorkflowSteps() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-4">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className="relative rounded-xl border border-border bg-card p-4 text-center shadow-sm"
        >
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <s.icon className="h-5 w-5" />
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            Step {i + 1}
          </div>
          <div className="mt-1 font-semibold text-foreground">{s.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
