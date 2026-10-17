import type { DailyMetric } from "@/api";
import { addDays, RANGE_PRESETS, type DatedValue, type ISODate } from "@/lib/dates";
import { isNum, signed } from "@/lib/format";

/** Health ranges: up to all time (weight, resting HR and HRV trends span years). */
export const HEALTH_PRESETS = RANGE_PRESETS.filter((p) => ["42d", "90d", "6m", "1y", "2y", "3y", "5y", "all"].includes(p.id));

/** When several sources report the same day, the first of these wins. */
const SOURCE_PREFERENCE = ["garmin", "google_health"];

const sourceRank = (source: string) => {
  const i = SOURCE_PREFERENCE.indexOf(source);
  return i === -1 ? 99 : i;
};

/** One item per date: the preferred source's, and within a source the latest. */
export function onePerDay<T>(items: T[], date: (t: T) => string, source: (t: T) => string, order: (t: T) => string): T[] {
  const best = new Map<string, T>();
  for (const item of items) {
    const key = date(item);
    const current = best.get(key);
    if (
      !current ||
      sourceRank(source(item)) < sourceRank(source(current)) ||
      (source(item) === source(current) && order(item) > order(current))
    ) {
      best.set(key, item);
    }
  }
  return [...best.values()].sort((a, b) => date(a).localeCompare(date(b)));
}

/** One value per day for a metric, from the preferred source that has it. */
export function metricSeries(rows: DailyMetric[], metric: string): DatedValue[] {
  const best = new Map<string, { rank: number; value: number }>();
  for (const r of rows) {
    if (r.metric !== metric) continue;
    const rank = sourceRank(r.source);
    const current = best.get(r.date);
    if (!current || rank < current.rank) best.set(r.date, { rank, value: r.value });
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v.value }));
}

/** Mean of the values in the `lastDays` days ending `end`; null when there are none. */
export function average(series: DatedValue[], lastDays: number, end: ISODate): number | null {
  const from = addDays(end, -(lastDays - 1));
  const values = series.filter((p) => p.date >= from && p.date <= end).map((p) => p.value);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** "+1.5 bpm vs prior week": this week's average against the week before. */
export function weekOverWeek(series: DatedValue[], end: ISODate, unit: string): string | undefined {
  const now = average(series, 7, end);
  const before = average(series, 7, addDays(end, -7));
  if (!isNum(now) || !isNum(before)) return undefined;
  return `${signed(now - before)} ${unit} vs prior week`;
}
