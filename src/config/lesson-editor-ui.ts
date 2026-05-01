/** Layout + editor chrome (not slide theme tokens — those live in @/themes/tokens). */

import {
  type PreviewThemeId,
  THEME_DISPLAY_LABEL,
} from "@/themes/tokens";

export { type PreviewThemeId, themeTokens, THEME_IDS, THEME_DISPLAY_LABEL } from "@/themes/tokens";

export const EDITOR_PAGE_BG = "#F8FAFC";
export const EDITOR_BORDER = "#E2E8F0";
export const EDITOR_BORDER_STYLE = `0.5px solid ${EDITOR_BORDER}` as const;

export const SIDEBAR_WIDTH_PX = 220;

/** Badge pill label shown in topbar */
export function themeBadgeLabel(id: PreviewThemeId): string {
  return THEME_DISPLAY_LABEL[id];
}
