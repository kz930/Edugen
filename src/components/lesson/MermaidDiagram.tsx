"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef } from "react";

let mermaidInitialized = false;

export function MermaidDiagram({ chart, slideKey }: { chart: string; slideKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        flowchart: {
          htmlLabels: true,
          useMaxWidth: false,
          padding: 16,
          nodeSpacing: 56,
          rankSpacing: 48,
          curve: "basis",
        },
      });
      mermaidInitialized = true;
    }
  }, []);

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
            svgEl.setAttribute("style", "max-width: 100%; height: auto; display: block;");
          }
        }
      })
      .catch(() => {
        if (!cancelled && el) {
          el.innerHTML =
            '<p class="text-center text-sm text-slate-500 px-3">Could not render diagram from this slide content.</p>';
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, slideKey, reactId]);

  return (
    <div
      ref={ref}
      className="flex min-h-[200px] w-full min-w-0 max-w-full items-center justify-center overflow-x-auto overflow-y-visible rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 [&_svg]:min-h-[120px]"
    />
  );
}
