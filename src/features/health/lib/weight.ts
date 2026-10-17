import type { BodyMeasurement } from "@/api";
import { addDays, daysBetween, type ISODate } from "@/lib/dates";
import { fromKg, type WeightUnit } from "@/lib/nutrition";

import { onePerDay } from "./series";

/** A day's weigh-in (kg) with the average of the week up to it, and the day as a number for a time axis. */
export type WeightPoint = { date: ISODate; day: number; kg: number; avgKg: number; source: string };

/** Days since 1970: a linear time axis, so years without weigh-ins show as the gap they are. */
export const dayNumber = (iso: ISODate) => daysBetween("1970-01-01", iso);
export const fromDayNumber = (n: number): ISODate => addDays("1970-01-01", Math.round(n));

/** One weigh-in per day (the preferred source's), oldest first, each with the average of the weigh-ins of the
 *  7 days up to it, the smoothing the ride pages use. */
export function weightPoints(rows: BodyMeasurement[]): WeightPoint[] {
  const days = onePerDay(
    rows.filter((r) => r.metric === "weight_kg" && r.value > 0),
    (r) => r.ts.slice(0, 10),
    (r) => r.source,
    (r) => r.ts,
  );
  const out: WeightPoint[] = [];
  let from = 0;
  let sum = 0;
  for (let i = 0; i < days.length; i++) {
    const date = days[i]!.ts.slice(0, 10);
    sum += days[i]!.value;
    while (daysBetween(days[from]!.ts.slice(0, 10), date) > 6) sum -= days[from++]!.value;
    out.push({ date, day: dayNumber(date), kg: days[i]!.value, avgKg: sum / (i - from + 1), source: days[i]!.source });
  }
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
