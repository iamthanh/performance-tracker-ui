import { useEffect, useState } from "react";

import { applyTheme, storedTheme, THEME_CHANGE_EVENT, type ThemeChoice } from "@/lib/theme";

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeChoice, string> = { system: "Auto", light: "Light", dark: "Dark" };

/** The saved light/dark choice, cycled Auto → Light → Dark. Every user of the hook stays in step. */
export function useThemeChoice() {
  const [theme, setTheme] = useState<ThemeChoice>(storedTheme);
  useEffect(() => {
    const update = () => setTheme(storedTheme());
    window.addEventListener(THEME_CHANGE_EVENT, update);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, update);
  }, []);
  const cycle = () => {
    const next = NEXT[theme];
    applyTheme(next);
    setTheme(next);
  };
  return { theme, label: LABEL[theme], cycle };
}
