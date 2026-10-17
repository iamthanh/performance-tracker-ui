import { parseISO, today, toISO, type ISODate } from "@/lib/dates";

/** The day in a `?day=YYYY-MM-DD` parameter; today if it is missing or invalid. */
export function dayFromParam(param: string | null): ISODate {
  // Round-trip through a Date so 2026-02-31 is rejected, not rolled over.
  const valid = !!param && /^\d{4}-\d{2}-\d{2}$/.test(param) && toISO(parseISO(param)) === param;
  return valid ? param! : today();
}
