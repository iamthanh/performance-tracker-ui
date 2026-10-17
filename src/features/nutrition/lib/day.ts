import { today, type ISODate } from "@/lib/dates";

/** The day in a `?day=YYYY-MM-DD` parameter; today if it is missing or invalid. */
export function dayFromParam(param: string | null): ISODate {
  return param && /^\d{4}-\d{2}-\d{2}$/.test(param) && !Number.isNaN(Date.parse(param)) ? param : today();
}
