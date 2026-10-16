// Shared Recharts settings, so every chart has the same frame: hairline grid, recessive axes.

import type { Colors } from "@/lib/theme";

/** Plot margins of a full-width chart (the negative left margin tucks the y-axis labels in). */
export const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: -8 };

/** Width of a y-axis with up to four-digit labels. */
export const Y_AXIS_WIDTH = 44;

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

/** Tooltip cursor of a line or area chart: a vertical hairline. */
export function lineCursor(c: Colors) {
  return { stroke: c.axis, strokeWidth: 1 };
}

/** Tooltip cursor of a bar chart: a faint band behind the hovered bar. */
export function barCursor(c: Colors, opacity: number) {
  return { fill: c.grid, opacity };
}
