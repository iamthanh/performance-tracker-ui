import { useEffect, useState } from "react";

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
const STORAGE_KEY = "pt-theme";

function readColors(): Colors {
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
  window.dispatchEvent(new Event("pt-theme"));
}

/** Resolved token colours for SVG attributes (Recharts), refreshed when the theme changes. */
export function useColors(): Colors {
  const [colors, setColors] = useState<Colors>(readColors);
  useEffect(() => {
    const update = () => setColors(readColors());
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    media?.addEventListener("change", update);
    window.addEventListener("pt-theme", update);
    return () => {
      media?.removeEventListener("change", update);
      window.removeEventListener("pt-theme", update);
    };
  }, []);
  return colors;
}

/** Shared axis/grid props: hairline, solid, recessive. */
export function axisProps(c: Colors) {
  return {
    stroke: c.axis,
    tick: { fill: c["text-muted"], fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: c.axis },
  } as const;
}

export function gridProps(c: Colors) {
  return { stroke: c.grid, strokeDasharray: undefined, vertical: false } as const;
}
