"use client";

import dynamic from "next/dynamic";
import type { SlideContent } from "@/types/lesson";
import {
  isDiagramVisual,
  isEquationVisual,
  isGraphVisual,
} from "@/types/visual-slide";
import { isValidGraphVisualSlide, isValidVisualSlide } from "@/lib/validate-visual-slide";
import { DiagramSlideRenderer } from "@/components/lesson/DiagramSlideRenderer";
import { EquationSlideRenderer } from "@/components/lesson/EquationSlideRenderer";

const GraphAlgorithmVisualizer = dynamic(
  () =>
    import("@/components/lesson/GraphAlgorithmVisualizer").then((m) => ({
      default: m.GraphAlgorithmVisualizer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
        Loading graph visualizer…
      </div>
    ),
  }
);

function VisualFallback({
  title,
  message,
  slide,
}: {
  title: string;
  message: string;
  slide: SlideContent;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <p className="text-sm font-medium text-amber-900">{message}</p>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {slide.bullets.length > 0 ? (
        <ul className="list-inside list-disc text-sm text-slate-800">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function VisualSlideRenderer({
  slide,
  accentClassName,
}: {
  slide: SlideContent;
  /** Optional border accent (Tailwind class) for graph panel */
  accentClassName?: string;
}) {
  const v = slide.visual;
  if (v == null) {
    return null;
  }

  try {
    if (!isValidVisualSlide(v)) {
      return (
        <VisualFallback
          slide={slide}
          title={slide.title}
          message="Visual data could not be validated. Showing title and bullets instead."
        />
      );
    }

    if (isGraphVisual(v)) {
      if (!isValidGraphVisualSlide(v)) {
        return (
          <VisualFallback
            slide={slide}
            title={slide.title}
            message="Graph visual JSON is incomplete or invalid."
          />
        );
      }
      return (
        <GraphAlgorithmVisualizer visual={v} accentClassName={accentClassName} />
      );
    }

    if (isDiagramVisual(v)) {
      return <DiagramSlideRenderer visual={v} />;
    }

    if (isEquationVisual(v)) {
      return <EquationSlideRenderer visual={v} />;
    }
  } catch (e) {
    return (
      <VisualFallback
        slide={slide}
        title={slide.title}
        message={
          e instanceof Error
            ? `Visual error: ${e.message}`
            : "Something went wrong rendering this visual."
        }
      />
    );
  }

  return (
    <VisualFallback
      slide={slide}
      title={slide.title}
      message="Unsupported visual kind."
    />
  );
}
