"use client";

import mermaid from "mermaid";
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
    if (!el || !chart.trim()) return;
    const id = `edugen-mmd-${reactId}-${slideKey}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    let cancelled = false;
    el.innerHTML = "";
    mermaid
      .render(id, chart)
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
      .catch(() => {
        if (!cancelled && el) {
          el.innerHTML =
            '<p class="text-center text-sm text-slate-400 px-3">Could not render diagram from this slide content.</p>';
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
