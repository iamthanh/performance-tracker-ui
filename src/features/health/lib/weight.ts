import type { WeightDay, WeightKind } from "@/api";
import { addDays, daysBetween, type ISODate } from "@/lib/dates";
import { fromKg, type WeightUnit } from "@/lib/nutrition";

/** Days since 1970: a linear time axis, so gaps show as gaps. */
export const dayNumber = (iso: ISODate) => daysBetween("1970-01-01", iso);
export const fromDayNumber = (n: number): ISODate => addDays("1970-01-01", Math.round(n));

export const KIND_LABEL: Record<WeightKind, string> = {
  weigh_in: "Weigh-in",
  interpolated: "Interpolated",
  estimated: "Estimated (long gap)",
  carried: "Carried forward",
};

/** A chart point: the raw weigh-in (dots, only where measured) and the trend split into a solid line (weigh-in and
 *  interpolated days) and a dashed one (estimated and carried days, joined to the weigh-ins at their ends). */
export type WeightPoint = {
  day: number;
  date: ISODate;
  kind: WeightKind;
  raw: number | null;
  /** How many readings `raw` averages. */
  readings: number;
  trend: number;
  solid: number | null;
  dashed: number | null;
  gap: number;
};

const isGuess = (k: WeightKind | undefined) => k === "estimated" || k === "carried";

export function chartPoints(days: WeightDay[], unit: WeightUnit): WeightPoint[] {
  const points = days.map((d, i): WeightPoint => {
    const trend = fromKg(d.kg, unit);
    const guess = isGuess(d.kind) || isGuess(days[i - 1]?.kind) || isGuess(days[i + 1]?.kind);
    return {
      day: dayNumber(d.date),
      date: d.date,
      kind: d.kind,
      raw: d.weigh_in === null ? null : fromKg(d.weigh_in, unit),
      readings: d.weigh_ins,
      trend,
      solid: isGuess(d.kind) ? null : trend,
      dashed: guess ? trend : null,
      gap: d.gap_days,
    };
  });
  // Days with no value at all (a gap of over a year) break both lines rather than being drawn across.
  const out: WeightPoint[] = [];
  points.forEach((p, i) => {
    const before = points[i - 1];
    if (before && p.day - before.day > 1) out.push({ ...before, day: (before.day + p.day) / 2, raw: null, solid: null, dashed: null });
    out.push(p);
  });
  return out;
}

/** Table rows: each weigh-in, and each run of filled days collapsed into one row. */
export type WeightRow =
  | { type: "weigh_in"; date: ISODate; raw: number; trend: number }
  | { type: "filled"; kind: Exclude<WeightKind, "weigh_in">; from: ISODate; to: ISODate; days: number; gap: number };

export function tableRows(days: WeightDay[]): WeightRow[] {
  const rows: WeightRow[] = [];
  for (const d of days) {
    if (d.kind === "weigh_in") {
      rows.push({ type: "weigh_in", date: d.date, raw: d.weigh_in!, trend: d.kg });
      continue;
    }
    const last = rows[rows.length - 1];
    if (last?.type === "filled" && last.kind === d.kind && daysBetween(last.to, d.date) === 1) {
      last.to = d.date;
      last.days += 1;
      last.gap = Math.max(last.gap, d.gap_days);
    } else {
      rows.push({ type: "filled", kind: d.kind, from: d.date, to: d.date, days: 1, gap: d.gap_days });
    }
  }
  return rows;
}

/** The range in numbers (in `unit`): the latest raw weigh-in, the trend now and its change, and days per kind. */
export function weightStats(days: WeightDay[], unit: WeightUnit) {
  if (!days.length) return null;
  const weighIns = days.filter((d) => d.weigh_in !== null);
  const lastWeighIn = weighIns[weighIns.length - 1];
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const counts = { weigh_in: 0, interpolated: 0, estimated: 0, carried: 0 } as Record<WeightKind, number>;
  for (const d of days) counts[d.kind] += 1;
  return {
    latestWeighIn: lastWeighIn ? fromKg(lastWeighIn.weigh_in!, unit) : null,
    latestWeighInDate: lastWeighIn?.date ?? null,
    trend: fromKg(last.kg, unit),
    trendKind: last.kind,
    trendDate: last.date,
    change: fromKg(last.kg, unit) - fromKg(first.kg, unit),
    counts,
  };
}
