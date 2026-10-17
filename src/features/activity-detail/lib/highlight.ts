/** A stretch of the workout marked on the charts (elapsed seconds on the stream clock). */
export type Highlight = { start_s: number; end_s: number; label: string };

/** Share of the chart's time axis a marked stretch is at least drawn as, so 30 s on a 10 h ride still shows. */
export const MIN_SPAN_SHARE = 0.004;

/** The stretch's `x1`/`x2` on charts of `rows` (seconds in `t`), widened about its middle to the minimum. */
export function visibleSpan(h: Highlight, rows: Record<string, number | null>[]): { x1: number; x2: number } {
  const first = rows[0]?.["t"] ?? 0;
  const last = rows[rows.length - 1]?.["t"] ?? first;
  const min = (last - first) * MIN_SPAN_SHARE;
  if (h.end_s - h.start_s >= min) return { x1: h.start_s, x2: h.end_s };
  const mid = (h.start_s + h.end_s) / 2;
  return { x1: mid - min / 2, x2: mid + min / 2 };
}
