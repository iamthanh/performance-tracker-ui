import type { LoadDay, ThresholdValue } from "../api/types";

/** Form (TSB) bands as TrainingPeaks describes them. */
export function formStatus(tsb: number): { label: string; detail: string } {
  if (tsb > 25) return { label: "Transition", detail: "Very fresh: fitness is likely being lost" };
  if (tsb > 5) return { label: "Fresh", detail: "Ready to race or test" };
  if (tsb >= -10) return { label: "Neutral", detail: "Maintaining" };
  if (tsb >= -30) return { label: "Optimal training", detail: "Productive training load" };
  return { label: "High risk", detail: "Accumulated fatigue: consider rest" };
}

/** Change in fitness (CTL) over the last `days` days: TrainingPeaks' ramp rate is the 7-day change. */
export function rampRate(days: LoadDay[], span = 7): number | null {
  if (days.length <= span) return null;
  const last = days[days.length - 1]!;
  const before = days[days.length - 1 - span]!;
  return last.ctl - before.ctl;
}

/** Drop the leading days before the first workout (an "all time" range starts long before). */
export function trimLeadingEmpty(days: LoadDay[]): LoadDay[] {
  const first = days.findIndex((d) => d.tss > 0 || d.ctl > 0 || d.unscored > 0);
  return first <= 0 ? days : days.slice(first);
}

/**
 * The threshold in effect on `day`, by the backend's rule (analysis.Timeline): the latest manual
 * value holds unless an automatic value dated after it rose above it (a new best effort); without
 * a manual value the latest automatic one applies; before the first value, the first one applies.
 */
export function thresholdOn(values: ThresholdValue[], day: string): number | null {
  const sorted = [...values].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const manual = sorted.filter((v) => v.origin === "manual");
  const auto = sorted.filter((v) => v.origin === "auto");
  const latest = (list: ThresholdValue[]) => [...list].reverse().find((v) => v.effective_date <= day);
  const m = latest(manual);
  const a = latest(auto);
  if (!m && !a) return sorted[0]?.value ?? null;
  if (!m) return a!.value;
  const surpassed = auto.some((v) => v.effective_date > m.effective_date && v.effective_date <= day && v.value > m.value);
  return surpassed && a ? a.value : m.value;
}

/** Step series of the value in effect: one point per date it can change, plus today. */
export function thresholdHistory(
  values: ThresholdValue[],
  end: string,
): { date: string; value: number; origin: "manual" | "auto" }[] {
  const dates = [...new Set(values.map((v) => v.effective_date))].sort();
  if (!dates.length) return [];
  const points: { date: string; value: number; origin: "manual" | "auto" }[] = [];
  for (const date of [...dates, ...(dates[dates.length - 1]! < end ? [end] : [])]) {
    const value = thresholdOn(values, date);
    if (value === null) continue;
    const origin = values.some((v) => v.origin === "manual" && v.value === value && v.effective_date <= date) ? "manual" : "auto";
    if (points.length && points[points.length - 1]!.value === value && date !== end) continue;
    points.push({ date, value, origin });
  }
  return points;
}

export function sum<T>(items: T[], pick: (item: T) => number | null | undefined): number {
  return items.reduce((total, item) => total + (pick(item) ?? 0), 0);
}
