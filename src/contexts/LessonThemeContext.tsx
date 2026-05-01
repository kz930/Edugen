"use client";

import type { PreviewThemeId } from "@/config/lesson-editor-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LessonThemeContextValue = {
  themeName: PreviewThemeId;
  setThemeName: (t: PreviewThemeId) => void;
};

const LessonThemeContext = createContext<LessonThemeContextValue | null>(null);

export function LessonThemeProvider({
  lessonId,
  children,
}: {
  lessonId: string;
  children: ReactNode;
}) {
  const [themeName, setThemeNameState] = useState<PreviewThemeId>("cs");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`edugen-preview-theme-${lessonId}`);
      if (
        raw === "cs" ||
        raw === "science" ||
        raw === "history" ||
        raw === "general"
      ) {
        setThemeNameState(raw);
      }
    } catch {
      /* ignore */
    }
  }, [lessonId]);

  const setThemeName = useCallback(
    (t: PreviewThemeId) => {
      setThemeNameState(t);
      try {
        localStorage.setItem(`edugen-preview-theme-${lessonId}`, t);
      } catch {
        /* ignore */
      }
    },
    [lessonId]
  );

  const value = useMemo(
    () => ({ themeName, setThemeName }),
    [themeName, setThemeName]
  );

  return (
    <LessonThemeContext.Provider value={value}>
      {children}
    </LessonThemeContext.Provider>
  );
}

export function useLessonTheme(): LessonThemeContextValue {
  const ctx = useContext(LessonThemeContext);
  if (!ctx) {
    throw new Error("useLessonTheme must be used within LessonThemeProvider");
  }
  return ctx;
}
