"use client";

import { splitFencedCode } from "@/lib/slide-code";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { SlideCodeBlock } from "@/components/lesson/SlideCodeBlock";

export function SlideRichBody({
  text,
  className,
  proseClassName,
}: {
  text: string;
  className?: string;
  proseClassName?: string;
}) {
  const segs = useMemo(() => splitFencedCode(text), [text]);
  return (
    <div className={cn("space-y-4", className)}>
      {segs.map((s, i) =>
        s.kind === "text" ? (
          <p
            key={i}
            className={cn(
              "whitespace-pre-wrap text-[17px] leading-relaxed text-teal-50/95",
              proseClassName
            )}
          >
            {s.text.trim()}
          </p>
        ) : (
          <SlideCodeBlock key={i} code={s.code} language={s.language} />
        )
      )}
    </div>
  );
}
