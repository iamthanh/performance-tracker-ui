// Colour tokens and the light/dark choice. The tokens themselves are defined in styles/tokens.css;
// charts (SVG attributes) read their resolved values through hooks/useColors.

const TOKENS = [
  "surface-1",
  "text-primary",
  "text-secondary",
  "text-muted",
  "grid",
  "axis",
  "series-1",
  "series-2",
  "series-3",
  "series-4",
  "series-7",
  "series-8",
  "diverging-pos",
  "diverging-neg",
  "neutral-mid",
] as const;

export type Token = (typeof TOKENS)[number];
export type Colors = Record<Token, string>;

export type ThemeChoice = "system" | "light" | "dark";

/** localStorage key; index.html reads it too, to apply the theme before first paint. */
const STORAGE_KEY = "pt-theme";
/** Window event fired after the theme changes. */
export const THEME_CHANGE_EVENT = "pt-theme";

export function readColors(): Colors {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(TOKENS.map((t) => [t, style.getPropertyValue(`--${t}`).trim() || "#888"])) as Colors;
}

export function storedTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice): void {
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // storage unavailable (private mode): the choice lasts for this page only
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
