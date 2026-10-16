// In-app URLs, built in one place so links and navigation always agree with the routes (app/routes.tsx).

import type { ISODate } from "./dates";

export function activityPath(activity: { source: string; source_id: string }): string {
  return `/activities/${encodeURIComponent(activity.source)}/${encodeURIComponent(activity.source_id)}`;
}

/** The calendar showing the month of `day`. */
export function calendarMonthPath(day: ISODate): string {
  return `/calendar?month=${day.slice(0, 7)}`;
}
