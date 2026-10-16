import { useMemo } from "react";

import { usePowerCurve } from "@/api";
import { presetRange } from "@/lib/dates";

import { COMPARE_PRESETS, rangeLabel } from "../lib/ranges";
import type { CurveChartPoint, CurveRow } from "../lib/types";

/** Power curves over two preset ranges (`b` may be "none"), merged by duration. */
export function usePowerCurveComparison(a: string, b: string) {
  const rangeA = presetRange(COMPARE_PRESETS.find((p) => p.id === a) ?? COMPARE_PRESETS[0]!);
  const presetB = COMPARE_PRESETS.find((p) => p.id === b);
  const rangeB = presetB ? presetRange(presetB) : null;
  const curveA = usePowerCurve({ start_date: rangeA.start, end_date: rangeA.end });
  const curveB = usePowerCurve({ start_date: rangeB?.start, end_date: rangeB?.end }, !!rangeB);
  const hasB = !!rangeB;

  const rows: CurveRow[] = useMemo(() => {
    const byA = new Map((curveA.data ?? []).map((p) => [p.duration_s, p]));
    const byB = new Map((curveB.data ?? []).map((p) => [p.duration_s, p]));
    const durations = [...new Set([...byA.keys(), ...(hasB ? byB.keys() : [])])].sort((x, y) => x - y);
    return durations.map((d) => ({ d, a: byA.get(d) ?? null, b: hasB ? (byB.get(d) ?? null) : null }));
  }, [curveA.data, curveB.data, hasB]);
  const points: CurveChartPoint[] = rows.map((r) => ({ d: r.d, a: r.a?.watts ?? null, b: r.b?.watts ?? null }));

  return { curveA, curveB, hasB, rows, points, labelA: rangeLabel(a), labelB: rangeLabel(b) };
}
