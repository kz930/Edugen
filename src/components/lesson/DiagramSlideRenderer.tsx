import type { DiagramVisualSlide } from "@/types/visual-slide";

export function DiagramSlideRenderer({ visual }: { visual: DiagramVisualSlide }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        {visual.title ?? "Diagram"}
      </h3>
      {visual.description ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{visual.description}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Structured diagram layout (boxes and arrows) can be extended here.
        </p>
      )}
    </div>
  );
}
