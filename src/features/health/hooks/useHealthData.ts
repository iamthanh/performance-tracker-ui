import { useMemo } from "react";

import { useBody, useDailyMetrics, useSleep, useTrainingLoad } from "@/api";
import { trimLeadingEmpty } from "@/lib/training";

import { metricSeries, onePerDay } from "../lib/series";
import type { Night } from "../lib/types";

/** Every health series over a date range, one value per day. */
export function useHealthData(range: { start: string; end: string }, allTime = false) {
  const metrics = useDailyMetrics({ start_date: range.start, end_date: range.end });
  const sleep = useSleep({ start_date: range.start, end_date: range.end });
  const body = useBody({ start_date: range.start, end_date: range.end });
  const load = useTrainingLoad({ start_date: range.start, end_date: range.end });

  const rows = metrics.data ?? [];
  const resting = useMemo(() => metricSeries(rows, "resting_hr"), [rows]);
  const hrv = useMemo(() => metricSeries(rows, "hrv_rmssd_ms"), [rows]);
  const sleepScore = useMemo(() => metricSeries(rows, "sleep_score"), [rows]);
  const weight = useMemo(
    () =>
      onePerDay(
        (body.data ?? []).filter((b) => b.metric === "weight_kg"),
        (b) => b.ts.slice(0, 10),
        (b) => b.source,
        (b) => b.ts,
      ).map((b) => ({ date: b.ts.slice(0, 10), value: b.value })),
    [body.data],
  );
  const nights: Night[] = useMemo(
    () =>
      onePerDay(sleep.data ?? [], (s) => s.local_date, (s) => s.source, (s) => s.end_time ?? "").map((s) => ({
        date: s.local_date,
        deep: (s.minutes_deep ?? 0) / 60,
        light: (s.minutes_light ?? 0) / 60,
        rem: (s.minutes_rem ?? 0) / 60,
        awake: (s.minutes_awake ?? 0) / 60,
        asleep: s.minutes_asleep,
      })),
    [sleep.data],
  );
  // "All time" starts years before the first workout: the form line starts with it.
  const form = (allTime ? trimLeadingEmpty(load.data ?? []) : (load.data ?? [])).map((d) => ({ date: d.date, value: d.tsb }));

  return {
    /** The first failed request, if any. */
    failed: [metrics, sleep, body].find((q) => q.isError),
    loading: metrics.isPending,
    empty: !metrics.isPending && !sleep.isPending && !body.isPending && !rows.length && !nights.length && !weight.length,
    load,
    sleep,
    form,
    resting,
    hrv,
    sleepScore,
    weight,
    nights,
  };
}
