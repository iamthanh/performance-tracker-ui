import { useMemo } from "react";

import { useSummary, useTrainingLoad } from "@/api";
import { dateTickFormatter, daysBetween, weekStart } from "@/lib/dates";
import { rampRate, trimLeadingEmpty } from "@/lib/training";

import type { LoadPoint } from "../lib/types";

/** Training load and weekly totals for a date range, with the figures the Fitness page shows. */
export function useFitnessData(range: { start: string; end: string }, allTime: boolean) {
  const load = useTrainingLoad({ start_date: range.start, end_date: range.end });
  const weeks = useSummary({ start_date: weekStart(range.start), end_date: range.end, group_by: "week" });

  // "All time" starts years before the first workout; other ranges show exactly what was asked for.
  const days = useMemo(() => (allTime ? trimLeadingEmpty(load.data ?? []) : (load.data ?? [])), [load.data, allTime]);
  const points: LoadPoint[] = useMemo(() => days.map((d) => ({ ...d, tssDot: d.tss > 0 ? d.tss : null })), [days]);
  const span = days.length ? daysBetween(days[0]!.date, days[days.length - 1]!.date) : 0;
  const weekRows = (weeks.data?.periods ?? []).filter((p) => !days.length || p.period >= weekStart(days[0]!.date));

  return {
    load,
    weeks,
    days,
    points,
    weekRows,
    tick: dateTickFormatter(span),
    latest: days[days.length - 1],
    ramp: rampRate(days),
    unscored: days.reduce((n, d) => n + d.unscored, 0),
  };
}
