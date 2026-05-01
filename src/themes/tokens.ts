/** Single source of truth for lesson slide themes — editor + Remotion video. */

export type PreviewThemeId = "cs" | "science" | "history" | "general";

export type ThemeNodeStyle = {
  bg: string;
  text: string;
  border: string;
};

export type ThemeTokens = {
  bg: string;
  bgSecondary: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  border: string;
  topBarStart: string;
  topBarEnd: string;
  nodes: {
    primary: ThemeNodeStyle;
    secondary: ThemeNodeStyle;
    highlight: ThemeNodeStyle;
  };
  code: {
    bg: string;
    keyword: string;
    fn: string;
    number: string;
    comment: string;
    string: string;
  };
  fontTitle: string;
  fontBody: string;
  fontMono: string;
};

export const themeTokens: Record<PreviewThemeId, ThemeTokens> = {
  cs: {
    bg: "#0F172A",
    bgSecondary: "#1E293B",
    textPrimary: "#F1F5F9",
    textMuted: "#94A3B8",
    accent: "#2DD4BF",
    accentSecondary: "#6366F1",
    border: "#334155",
    topBarStart: "#0D9488",
    topBarEnd: "#6366F1",
    nodes: {
      primary: {
        bg: "#1D4ED8",
        text: "#BFDBFE",
        border: "#3B82F6",
      },
      secondary: {
        bg: "#0F766E",
        text: "#99F6E4",
        border: "#14B8A6",
      },
      highlight: {
        bg: "#7C3AED",
        text: "#DDD6FE",
        border: "#8B5CF6",
      },
    },
    code: {
      bg: "#1E293B",
      keyword: "#818CF8",
      fn: "#34D399",
      number: "#FB923C",
      comment: "#475569",
      string: "#FCD34D",
    },
    fontTitle: "monospace",
    fontBody: "sans-serif",
    fontMono: "monospace",
  },
  science: {
    bg: "#F8FAFC",
    bgSecondary: "#F1F5F9",
    textPrimary: "#0F172A",
    textMuted: "#64748B",
    accent: "#0EA5E9",
    accentSecondary: "#10B981",
    border: "#E2E8F0",
    topBarStart: "#0EA5E9",
    topBarEnd: "#10B981",
    nodes: {
      primary: {
        bg: "#E0F2FE",
        text: "#0369A1",
        border: "#7DD3FC",
      },
      secondary: {
        bg: "#D1FAE5",
        text: "#065F46",
        border: "#6EE7B7",
      },
      highlight: {
        bg: "#FEF3C7",
        text: "#92400E",
        border: "#FCD34D",
      },
    },
    code: {
      bg: "#F1F5F9",
      keyword: "#7C3AED",
      fn: "#0369A1",
      number: "#DC2626",
      comment: "#94A3B8",
      string: "#16A34A",
    },
    fontTitle: "sans-serif",
    fontBody: "sans-serif",
    fontMono: "monospace",
  },
  history: {
    bg: "#FAFAF7",
    bgSecondary: "#F5F0E8",
    textPrimary: "#1C1917",
    textMuted: "#78716C",
    accent: "#B45309",
    accentSecondary: "#92400E",
    border: "#E7E5E4",
    topBarStart: "#B45309",
    topBarEnd: "#92400E",
    nodes: {
      primary: {
        bg: "#FEF3C7",
        text: "#92400E",
        border: "#FCD34D",
      },
      secondary: {
        bg: "#FEE2E2",
        text: "#991B1B",
        border: "#FCA5A5",
      },
      highlight: {
        bg: "#F5F0E8",
        text: "#44403C",
        border: "#D6D3D1",
      },
    },
    code: {
      bg: "#F5F0E8",
      keyword: "#B45309",
      fn: "#92400E",
      number: "#DC2626",
      comment: "#A8A29E",
      string: "#16A34A",
    },
    fontTitle: "serif",
    fontBody: "sans-serif",
    fontMono: "monospace",
  },
  general: {
    bg: "#FFFFFF",
    bgSecondary: "#F0FDF4",
    textPrimary: "#111827",
    textMuted: "#6B7280",
    accent: "#16A34A",
    accentSecondary: "#7C3AED",
    border: "#E5E7EB",
    topBarStart: "#16A34A",
    topBarEnd: "#7C3AED",
    nodes: {
      primary: {
        bg: "#DCFCE7",
        text: "#14532D",
        border: "#86EFAC",
      },
      secondary: {
        bg: "#EDE9FE",
        text: "#4C1D95",
        border: "#C4B5FD",
      },
      highlight: {
        bg: "#FEF9C3",
        text: "#713F12",
        border: "#FDE047",
      },
    },
    code: {
      bg: "#F9FAFB",
      keyword: "#7C3AED",
      fn: "#16A34A",
      number: "#DC2626",
      comment: "#9CA3AF",
      string: "#B45309",
    },
    fontTitle: "sans-serif",
    fontBody: "sans-serif",
    fontMono: "monospace",
  },
};

export const THEME_IDS: PreviewThemeId[] = ["cs", "science", "history", "general"];

export const THEME_DISPLAY_LABEL: Record<PreviewThemeId, string> = {
  cs: "CS",
  science: "Science",
  history: "History",
  general: "General",
};

/** Map token font keywords to CSS font stacks for DOM / Remotion */
export function themeFontStack(kind: keyof Pick<ThemeTokens, "fontTitle" | "fontBody" | "fontMono">, t: ThemeTokens): string {
  const raw = kind === "fontTitle" ? t.fontTitle : kind === "fontBody" ? t.fontBody : t.fontMono;
  if (raw === "monospace") return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  if (raw === "serif") return "Georgia, 'Times New Roman', serif";
  return "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
}

export function parsePreviewThemeId(value: unknown): PreviewThemeId | null {
  if (value === "cs" || value === "science" || value === "history" || value === "general") {
    return value;
  }
  return null;
}
