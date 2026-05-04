import type { EquationVisualSlide } from "@/types/visual-slide";

export function EquationSlideRenderer({ visual }: { visual: EquationVisualSlide }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        {visual.title ?? "Equation"}
      </h3>
      {visual.expression ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-base text-emerald-100">
          {visual.expression}
        </pre>
      ) : null}
      {visual.desmosExpression ? (
        <p className="mt-2 text-xs text-slate-500">
          Desmos (optional embed): <code className="rounded bg-slate-100 px-1">{visual.desmosExpression}</code>
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          A Desmos calculator embed can be wired to <code>desmosExpression</code> in a future
          update.
        </p>
      )}
    </div>
  );
}
