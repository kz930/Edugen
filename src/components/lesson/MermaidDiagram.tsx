"use client";

import mermaid from "mermaid";
import { normalizeMermaidInput } from "@/lib/mermaid-sanitize";
import { useEffect, useId, useRef } from "react";

let mermaidLastTheme: "dark" | "neutral" | null = null;

export function MermaidDiagram({
  chart,
  slideKey,
  surface = "light",
}: {
  chart: string;
  slideKey: string;
  surface?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");

  useEffect(() => {
    const theme = surface === "dark" ? "dark" : "neutral";
    if (mermaidLastTheme !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: "loose",
        htmlLabels: true,
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        flowchart: {
          useMaxWidth: false,
          padding: 20,
          nodeSpacing: 56,
          rankSpacing: 52,
          curve: "basis",
          wrappingWidth: 640,
        },
      });
      mermaidLastTheme = theme;
    }
  }, [surface]);

  useEffect(() => {
    const el = ref.current;
    const chartClean = normalizeMermaidInput(chart);
    if (!el || !chartClean.trim()) return;
    const id = `edugen-mmd-${reactId}-${slideKey}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    let cancelled = false;
    el.innerHTML = "";
    mermaid
      .render(id, chartClean)
      .then(({ svg }) => {
        if (!cancelled && el) {
          el.innerHTML = svg;
          const svgEl = el.querySelector("svg");
          if (svgEl) {
            svgEl.setAttribute(
              "class",
              "edugen-mermaid-svg max-w-none !w-auto !h-auto shrink-0"
            );
            svgEl.setAttribute(
              "style",
              "width: auto; height: auto; max-width: none; display: block;"
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[MermaidDiagram] render failed:", err);
        }
        if (!cancelled && el) {
          el.innerHTML =
            '<p class="text-center text-sm text-slate-400 px-3">Could not render this diagram — invalid Mermaid syntax. Start with <span class="font-mono text-slate-300">flowchart TB</span> or <span class="font-mono text-slate-300">graph LR</span>, or wrap only the diagram in a fenced <span class="font-mono text-slate-300">mermaid</span> markdown block.</p>';
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, slideKey, reactId, surface]);

  const wrap =
    surface === "dark"
      ? "edugen-mermaid-scroll border-white/10 bg-slate-950/50"
      : "edugen-mermaid-scroll border-slate-200/80 bg-slate-50/80";

  return (
    <div
      className={`${wrap} w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible rounded-xl p-3 [scrollbar-gutter:stable]`}
    >
      <div ref={ref} className="inline-block min-h-[200px] min-w-min align-middle" />
    </div>
  );
}
