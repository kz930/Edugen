import React, { createContext, useContext, useMemo } from "react";
import type { PreviewThemeId, ThemeTokens } from "@/themes/tokens";
import { themeTokens } from "@/themes/tokens";

const RemotionThemeCtx = createContext<ThemeTokens | null>(null);

export function RemotionLessonThemeProvider({
  themeName,
  children,
}: {
  themeName: PreviewThemeId;
  children: React.ReactNode;
}) {
  const value = useMemo(() => themeTokens[themeName], [themeName]);
  return (
    <RemotionThemeCtx.Provider value={value}>{children}</RemotionThemeCtx.Provider>
  );
}

export function useRemotionLessonTheme(): ThemeTokens {
  const ctx = useContext(RemotionThemeCtx);
  if (!ctx) {
    throw new Error(
      "useRemotionLessonTheme must be used within RemotionLessonThemeProvider"
    );
  }
  return ctx;
}
