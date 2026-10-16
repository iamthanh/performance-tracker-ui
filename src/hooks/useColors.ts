import { useEffect, useState } from "react";

import { readColors, THEME_CHANGE_EVENT, type Colors } from "@/lib/theme";

/** Resolved token colours for SVG attributes (Recharts), refreshed when the theme changes. */
export function useColors(): Colors {
  const [colors, setColors] = useState<Colors>(readColors);
  useEffect(() => {
    const update = () => setColors(readColors());
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    media?.addEventListener("change", update);
    window.addEventListener(THEME_CHANGE_EVENT, update);
    return () => {
      media?.removeEventListener("change", update);
      window.removeEventListener(THEME_CHANGE_EVENT, update);
    };
  }, []);
  return colors;
}
