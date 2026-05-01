"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Highlighter = typeof import("react-syntax-highlighter").Prism;

export function SlideCodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}) {
  const [Prism, setPrism] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-syntax-highlighter").then((m) => {
      if (!cancelled) setPrism(() => m.Prism);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Prism) {
    return (
      <pre
        className={cn(
          "overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-teal-100/90",
          className
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-teal-500/25 shadow-lg shadow-black/30",
        className
      )}
    >
      <Prism
        language={normalizeLang(language)}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.75rem",
          padding: "1rem 1.1rem",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
          background: "rgb(15 23 42 / 0.92)",
        }}
        codeTagProps={{
          className: "font-mono",
        }}
        showLineNumbers={code.split("\n").length > 2}
      >
        {code.trimEnd()}
      </Prism>
    </div>
  );
}

function normalizeLang(lang: string): string {
  const l = lang.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    yml: "yaml",
    text: "markdown",
    md: "markdown",
    json: "json",
    css: "css",
    html: "html",
    sql: "sql",
    go: "go",
    rust: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
  };
  const m = map[l] ?? l;
  const supported = new Set([
    "javascript",
    "typescript",
    "jsx",
    "python",
    "bash",
    "yaml",
    "markdown",
    "json",
    "css",
    "html",
    "sql",
    "go",
    "rust",
    "java",
    "c",
    "cpp",
    "csharp",
    "ruby",
  ]);
  return supported.has(m) ? m : "javascript";
}
