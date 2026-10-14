// Local calendar dates as YYYY-MM-DD strings. Arithmetic is done in UTC so DST never shifts a day.

export type ISODate = string;

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Today on the user's local clock. */
export function today(now: Date = new Date()): ISODate {
  return toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseISO(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toISO(d);
}

/** Monday of the week containing `iso` (weeks start Monday, like the API). */
export function weekStart(iso: ISODate): ISODate {
  const d = parseISO(iso);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
}

export function monthStart(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function monthEnd(iso: ISODate): ISODate {
  return addDays(addMonths(monthStart(iso), 1), -1);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

const dayFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonthFmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });

export const formatDay = (iso: ISODate) => dayFmt.format(parseISO(iso));
export const formatFullDay = (iso: ISODate) => fullFmt.format(parseISO(iso));
export const formatMonth = (iso: ISODate) => monthFmt.format(parseISO(iso));
export const formatShortMonth = (iso: ISODate) => shortMonthFmt.format(parseISO(iso));

export interface RangePreset {
  id: string;
  label: string;
  days?: number;
  all?: boolean;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: "42d", label: "6 weeks", days: 42 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "6m", label: "6 months", days: 182 },
  { id: "1y", label: "1 year", days: 365 },
  { id: "2y", label: "2 years", days: 730 },
  { id: "all", label: "All time", all: true },
];

export const EARLIEST: ISODate = "2000-01-01";

/** Start/end of a preset ending today (inclusive). "All time" starts at EARLIEST. */
export function presetRange(preset: RangePreset, end: ISODate = today()): { start: ISODate; end: ISODate } {
  if (preset.all || !preset.days) return { start: EARLIEST, end };
  return { start: addDays(end, -(preset.days - 1)), end };
}
