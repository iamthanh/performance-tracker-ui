import type { CardioDay, CardioRide } from "@/api";
import { addDays, daysBetween, type ISODate } from "@/lib/dates";

/** Days since 1970 and back, for a numeric date axis (the rides' dots and the line share it). */
export const dayNumber = (iso: ISODate) => daysBetween("1970-01-01", iso);
export const fromDayNumber = (n: number): ISODate => addDays("1970-01-01", Math.round(n));

/** What the main cardio chart shows. */
export type CardioView = "hr" | "power" | "score" | "vo2max";

export const VIEW_LABELS: Record<CardioView, string> = { hr: "Heart rate", power: "Power", score: "Score", vo2max: "VO2max" };

/** The days of the range from the first with a value (the aerobic window needs a few rides first). */
export function cardioDays(days: CardioDay[]): CardioDay[] {
  const first = days.findIndex((d) => d.hr_at_ref !== null || d.score !== null);
  return first < 0 ? [] : days.slice(first);
}

/** The day's value in a view. */
export function viewValue(day: CardioDay, view: CardioView): number | null {
  return view === "hr" ? day.hr_at_ref : view === "power" ? day.power_at_ref : view === "score" ? day.score : day.vo2max;
}

/** Lower is fitter only for heart rate. */
export const LOWER_IS_FITTER: Record<CardioView, boolean> = { hr: true, power: false, score: false, vo2max: false };

export type CardioPoint = {
  day: number;
  date: string;
  /** The window's value (the line). */
  value: number | null;
  /** The mean of the day's rides, corrected (a dot; heart rate and power views only). */
  ride: number | null;
  rides: CardioRide[];
  source: CardioDay;
};

/** One point per day of the range: the line, and the day's rides as a dot. */
export function cardioPoints(days: CardioDay[], rides: CardioRide[], view: CardioView): CardioPoint[] {
  const byDate = new Map<string, CardioRide[]>();
  for (const r of rides) {
    if (r.bpm === null) continue;
    byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  }
  return days.map((d) => {
    const own = byDate.get(d.date) ?? [];
    const values = own.map((r) => (view === "hr" ? r.bpm : view === "power" ? r.power_w : null)).filter((v): v is number => v !== null);
    return {
      day: dayNumber(d.date),
      date: d.date,
      value: viewValue(d, view),
      ride: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      rides: own,
      source: d,
    };
  });
}

/** "fitter" / "less fit" for a change of a view's value (null under `minimum`). */
export function fitness(delta: number | null, view: CardioView, minimum = 0.05): "fitter" | "less fit" | null {
  if (delta === null || Math.abs(delta) < minimum) return null;
  return delta < 0 === LOWER_IS_FITTER[view] ? "fitter" : "less fit";
}

/** Rows for the table twin: every day for short ranges, else one a week (the last day always). */
export function weeklyRows<T>(days: T[], maxRows = 120): T[] {
  if (days.length <= maxRows) return days;
  const last = days.length - 1;
  return days.filter((_, i) => (last - i) % 7 === 0);
}
