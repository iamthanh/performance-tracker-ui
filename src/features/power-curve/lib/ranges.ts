import { RANGE_PRESETS } from "@/lib/dates";

/** Ranges a power curve can be compared over (6 weeks is too short to be a fair best). */
export const COMPARE_PRESETS = RANGE_PRESETS.filter((p) => p.id !== "42d");

/** The durations shown as tiles. */
export const KEY_DURATIONS = [5, 60, 300, 1200, 3600];

/** Log-axis ticks: 1 s to 5 h. */
export const DURATION_TICKS = [1, 5, 15, 60, 300, 1200, 3600, 10800, 18000];

/** "Last 90 days", "All time"; "" for an unknown id (e.g. "none"). */
export function rangeLabel(id: string): string {
  const preset = COMPARE_PRESETS.find((p) => p.id === id);
  if (!preset) return "";
  return preset.all ? "All time" : `Last ${preset.label}`;
}
