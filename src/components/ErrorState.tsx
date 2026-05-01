import { AlertCircle } from "lucide-react";

export function ErrorState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-left"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{title}</p>
          {detail ? (
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
