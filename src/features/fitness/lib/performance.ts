import type { PerformanceComponent, PerformanceDay, PerformanceEvent, PerformanceWeights } from "@/api";
import { daysBetween } from "@/lib/dates";

/** A component counts as stale when its last near-maximal effort is older than this. */
export const STALE_DAYS = 42;

/** The days of the range that have a score (the index starts with the first ride with power). */
export function scoredDays(days: PerformanceDay[]): PerformanceDay[] {
  const first = days.findIndex((d) => d.score !== null);
  return first < 0 ? [] : days.slice(first);
}

/** First and last value of a series over the range, and the change between them. */
export function change(values: (number | null)[]): { first: number | null; last: number | null; delta: number | null } {
  const present = values.filter((v): v is number => v !== null);
  const first = present[0] ?? null;
  const last = present[present.length - 1] ?? null;
  return { first, last, delta: first !== null && last !== null ? last - first : null };
}

/** Days since a component was last tested on `day`, or null if never. */
export function daysSinceTested(tested: string | null, day: string): number | null {
  return tested ? daysBetween(tested, day) : null;
}

/** Each weight as a share of all of them, in %. */
export function weightShares(weights: PerformanceWeights): PerformanceWeights {
  const total = Object.values(weights).reduce((t, w) => t + w, 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, (w / total) * 100])) as PerformanceWeights;
}

/** What raised the index, newest first. */
export function newestFirst(events: PerformanceEvent[]): PerformanceEvent[] {
  return [...events].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Rows for the table twin: every day for short ranges, else one a week (the last day always). */
export function tableDays(days: PerformanceDay[], maxRows = 120): PerformanceDay[] {
  if (days.length <= maxRows) return days;
  const last = days.length - 1;
  return days.filter((_, i) => (last - i) % 7 === 0);
}

/** The component's index per day, for a small chart. */
export function componentSeries(days: PerformanceDay[], key: PerformanceComponent): { date: string; value: number | null }[] {
  return days.map((d) => ({ date: d.date, value: d.components[key].index }));
}

/** A rise's cause in words: "power +4.7 %, 1.1 % lighter". */
export function splitText(split: { power_pct: number; weight_pct: number } | null): string | null {
  if (!split) return null;
  const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "±");
  const power = `power ${sign(split.power_pct)}${Math.abs(split.power_pct).toFixed(1)} %`;
  const w = split.weight_pct;
  const weight = Math.abs(w) < 0.05 ? "same weight" : `${Math.abs(w).toFixed(1)} % ${w > 0 ? "lighter" : "heavier"}`;
  return `${power}, ${weight}`;
}
