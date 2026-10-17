import type { ActivityRow, NutritionDay } from "@/api";
import { addDays, monthEnd, monthStart, today, weekStart, type ISODate } from "@/lib/dates";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The first day of the month in a `?month=YYYY-MM` parameter; the current month if it is missing or invalid. */
export function monthFromParam(param: string | null): ISODate {
  const requested = param ?? "";
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? `${requested}-01` : monthStart(today());
}

/** The Monday-to-Sunday weeks covering a month: the first and last day shown. */
export function monthGrid(month: ISODate): { first: ISODate; last: ISODate; weekStarts: ISODate[] } {
  const first = weekStart(month);
  const last = addDays(weekStart(monthEnd(month)), 6);
  const weekStarts: ISODate[] = [];
  for (let w = first; w <= last; w = addDays(w, 7)) weekStarts.push(w);
  return { first, last, weekStarts };
}

/** Workouts by local date, each day's in start order. */
export function groupByDay(activities: ActivityRow[]): Map<ISODate, ActivityRow[]> {
  const map = new Map<ISODate, ActivityRow[]>();
  for (const a of activities) {
    const list = map.get(a.local_date) ?? [];
    list.push(a);
    map.set(a.local_date, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  return map;
}

/** Average kcal eaten per logged day and burned per day the watch reported, in the month of `month`. */
export function monthEnergy(days: NutritionDay[], month: ISODate): { eaten: number | null; burned: number | null } {
  const inMonth = days.filter((d) => d.date.slice(0, 7) === month.slice(0, 7));
  const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
  return {
    eaten: mean(inMonth.flatMap((d) => (d.entries && d.intake.kcal !== null ? [d.intake.kcal] : []))),
    burned: mean(inMonth.flatMap((d) => (d.total_kcal !== null ? [d.total_kcal] : []))),
  };
}
