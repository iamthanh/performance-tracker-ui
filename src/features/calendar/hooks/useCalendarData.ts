import { useMemo } from "react";

import { useActivities, useSummary } from "@/api";
import { monthEnd, type ISODate } from "@/lib/dates";

import { groupByDay, monthGrid } from "../lib/calendar";

/** The month's workouts by day, weekly totals and the month's totals. */
export function useCalendarData(month: ISODate) {
  const { first, last, weekStarts } = monthGrid(month);
  const activities = useActivities({ start_date: first, end_date: last, limit: 2000 });
  const weeks = useSummary({ start_date: first, end_date: last, group_by: "week" });
  const monthTotals = useSummary({ start_date: month, end_date: monthEnd(month), group_by: "month" });

  const byDay = useMemo(() => groupByDay(activities.data ?? []), [activities.data]);
  const weekTotals = new Map((weeks.data?.periods ?? []).map((p) => [p.period, p.total]));
  return { activities, monthTotals, weekStarts, byDay, weekTotals };
}
