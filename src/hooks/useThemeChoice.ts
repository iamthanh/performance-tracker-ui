import { useState } from "react";

import { applyTheme, storedTheme, type ThemeChoice } from "@/lib/theme";

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeChoice, string> = { system: "Auto", light: "Light", dark: "Dark" };

/** The saved light/dark choice, cycled Auto → Light → Dark. */
export function useThemeChoice() {
  const [theme, setTheme] = useState<ThemeChoice>(storedTheme);
  const cycle = () => {
    const next = NEXT[theme];
    applyTheme(next);
    setTheme(next);
  };
  return { theme, label: LABEL[theme], cycle };
}
