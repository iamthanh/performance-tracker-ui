import { useThemeChoice } from "@/hooks";

export function ThemeToggle() {
  const { label, cycle } = useThemeChoice();
  return (
    <button type="button" className="btn ghost small" onClick={cycle} title="Colour theme">
      Theme: {label}
    </button>
  );
}
