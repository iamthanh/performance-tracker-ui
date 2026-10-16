import { useMemo } from "react";

import type { ThresholdValue } from "@/api";
import { formatShortMonth, parseISO, toISO, today } from "@/lib/dates";
import { thresholdHistory } from "@/lib/training";

/** The FTP in effect over time as chart points (`t` in ms), with one x-axis tick per year. */
export function useFtpHistory(values: ThresholdValue[]) {
  const points = useMemo(
    () => thresholdHistory(values.filter((v) => v.metric === "ftp_w"), today()).map((p) => ({ ...p, t: parseISO(p.date).getTime() })),
    [values],
  );
  // One tick per year (Jan 1) across the history's span.
  const yearTicks = useMemo(() => {
    if (!points.length) return [];
    const first = Number(points[0]!.date.slice(0, 4)) + 1;
    const last = Number(points[points.length - 1]!.date.slice(0, 4));
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => Date.UTC(first + i, 0, 1));
  }, [points]);
  const tick = (t: number) => (yearTicks.length ? toISO(new Date(t)).slice(0, 4) : formatShortMonth(toISO(new Date(t))));
  return { points, yearTicks, tick };
}
