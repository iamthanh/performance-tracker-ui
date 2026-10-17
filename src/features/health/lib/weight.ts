import type { BodyMeasurement } from "@/api";
import { addDays, daysBetween, type ISODate } from "@/lib/dates";
import { fromKg, type WeightUnit } from "@/lib/nutrition";

/** A day's weigh-in (kg) with the average of the week up to it, and the day as a number for a time axis. */
export type WeightPoint = { date: ISODate; day: number; kg: number; avgKg: number; source: string };

/** Days since 1970: a linear time axis, so years without weigh-ins show as the gap they are. */
export const dayNumber = (iso: ISODate) => daysBetween("1970-01-01", iso);
export const fromDayNumber = (n: number): ISODate => addDays("1970-01-01", Math.round(n));

/** One weight per day (the average of every source's, as the ride pages take it), oldest first, each with the
 *  average of the days' weights over the 7 days up to it. */
export function weightPoints(rows: BodyMeasurement[]): WeightPoint[] {
  const byDay = new Map<string, { sum: number; n: number; sources: Set<string> }>();
  for (const r of rows) {
    if (r.metric !== "weight_kg" || !(r.value > 0)) continue;
    const date = r.ts.slice(0, 10);
    const day = byDay.get(date) ?? { sum: 0, n: 0, sources: new Set<string>() };
    day.sum += r.value;
    day.n += 1;
    day.sources.add(r.source);
    byDay.set(date, day);
  }
  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, kg: d.sum / d.n, source: [...d.sources].sort().join(", ") }));
  const out: WeightPoint[] = [];
  let from = 0; // the first day of the 7 up to day i
  let sum = 0;
  days.forEach((d, i) => {
    sum += d.kg;
    while (daysBetween(days[from]!.date, d.date) > 6) sum -= days[from++]!.kg;
    out.push({ ...d, day: dayNumber(d.date), avgKg: sum / (i - from + 1) });
  });
  return out;
}

/** The weigh-ins as chart points, with a break (no average) wherever more than a week passes between two, so the
 *  line does not draw a trend across a gap. */
export function withBreaks<T extends { day: number }>(points: T[], gapDays = 7): (T | { day: number; avg: null })[] {
  const out: (T | { day: number; avg: null })[] = [];
  points.forEach((p, i) => {
    const before = points[i - 1];
    if (before && p.day - before.day > gapDays) out.push({ day: (before.day + p.day) / 2, avg: null });
    out.push(p);
  });
  return out;
}

/** The points in [start, end]. */
export function between(points: WeightPoint[], start: ISODate, end: ISODate): WeightPoint[] {
  return points.filter((p) => p.date >= start && p.date <= end);
}

/** Latest, change (7-day average, first to last) and lowest/highest weigh-in, in `unit`. */
export function weightStats(points: WeightPoint[], unit: WeightUnit) {
  if (!points.length) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const kgs = points.map((p) => p.kg);
  return {
    latest: fromKg(last.kg, unit),
    latestDate: last.date,
    average: fromKg(last.avgKg, unit),
    change: fromKg(last.avgKg, unit) - fromKg(first.avgKg, unit),
    low: fromKg(Math.min(...kgs), unit),
    high: fromKg(Math.max(...kgs), unit),
    count: points.length,
  };
}
