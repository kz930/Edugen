"use client";

import type { RetrievedSource, SourceType } from "@/types/lesson";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const typeLabels: Record<SourceType, string> = {
  article: "Article",
  documentation: "Docs",
  video: "Video",
  academic: "Academic",
  unknown: "Unknown",
};

export function SourceResultCard({
  source,
  checked,
  onCheckedChange,
  citationNumber,
}: {
  source: RetrievedSource;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  citationNumber: number;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors",
        checked && "ring-2 ring-primary/30"
      )}
    >
      <div className="pt-1">
        <Checkbox
          id={source.id}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Label htmlFor={source.id} className="cursor-pointer text-base font-semibold leading-tight">
            {source.title}
          </Label>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="muted" className="font-mono text-[10px]">
              [{citationNumber}]
            </Badge>
            <Badge variant="secondary">{typeLabels[source.type]}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{source.snippet}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{source.domain}</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open source
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
