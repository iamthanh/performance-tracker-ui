import type { Durability, RideWeight } from "@/api";
import { formatDay } from "@/lib/dates";
import { isNum, num } from "@/lib/format";

/** Watts (or kJ) per kg, or null without both. */
export function perKg(value: number | null | undefined, kg: number | null | undefined): number | null {
  return isNum(value) && isNum(kg) && kg > 0 ? value / kg : null;
}

/** "3.42 W/kg", or an em dash. */
export function wPerKg(watts: number | null | undefined, kg: number | null | undefined): string {
  const v = perKg(watts, kg);
  return isNum(v) ? `${num(v, 2)} W/kg` : "—";
}

/** Where the weight behind the per-kg values comes from. */
export function weightNote(weight: RideWeight): string {
  return weight.origin === "pre_workout"
    ? `${num(weight.kg, 1)} kg, weighed before the ride`
    : `${num(weight.kg, 1)} kg, latest weigh-in (${formatDay(weight.date)})`;
}

/** A durability step in kJ: "1,200". */
export function stepText(step: number): string {
  return num(step);
}

/** Heading of a durability step: "From the start", "After 700 kJ", with a weight "After 700 kJ (10.0 kJ/kg)". */
export function stepLabel(step: number, unit: Durability["unit"], kg?: number | null): string {
  if (step === 0) return "From the start";
  const kjPerKg = perKg(step, kg);
  return `After ${stepText(step)} ${unit}${kjPerKg === null ? "" : ` (${num(kjPerKg, 1)} kJ/kg)`}`;
}

/** Round x-axis ticks for a durability chart: 100, 200, 500 or 1000 kJ apart, at most about 10. */
export function stepTicks(last: number): number[] {
  const spacing = [100, 200, 500, 1000, 2000, 5000].find((s) => last / s <= 10) ?? 10000;
  return Array.from({ length: Math.floor(last / spacing) + 1 }, (_, i) => i * spacing);
}

export type DurabilityCell = { watts: number | null; ofFresh: number | null };
export type DurabilityRow = { duration_s: number; cells: DurabilityCell[] };

/** Each duration's best watts per step with its share of the from-the-start value, in %. */
export function durabilityRows(d: Durability): DurabilityRow[] {
  return d.rows.map((r) => {
    const fresh = r.watts[0];
    return {
      duration_s: r.duration_s,
      cells: r.watts.map((w) => ({ watts: w, ofFresh: isNum(w) && isNum(fresh) && fresh > 0 ? (w / fresh) * 100 : null })),
    };
  });
}

/** One chart point per step: `{step, d60: % of fresh, d300: ...}`. */
export function durabilityChart(d: Durability): Record<string, number | null>[] {
  const rows = durabilityRows(d);
  return d.steps.map((step, i) => {
    const point: Record<string, number | null> = { step };
    for (const r of rows) point[`d${r.duration_s}`] = r.cells[i]!.ofFresh;
    return point;
  });
}

/** The largest fade (lowest share of fresh) at the last step that has a value, per duration. */
export function worstFade(d: Durability): { duration_s: number; ofFresh: number; step: number } | null {
  let worst: { duration_s: number; ofFresh: number; step: number } | null = null;
  for (const r of durabilityRows(d)) {
    for (let i = r.cells.length - 1; i > 0; i--) {
      const share = r.cells[i]!.ofFresh;
      if (isNum(share)) {
        if (!worst || share < worst.ofFresh) worst = { duration_s: r.duration_s, ofFresh: share, step: d.steps[i]! };
        break;
      }
    }
  }
  return worst;
}

/** Time-axis ticks at the work done by round elapsed times, leaving out marks that would crowd the previous
 *  one (a stop adds time but no work): at least `minGap` (a share of the axis) apart. */
export function timeTicks(marks: { time_s: number; kj: number }[], last: number, minGap = 0.06): { kj: number; time_s: number }[] {
  const out: { kj: number; time_s: number }[] = [];
  let prev = 0; // the "Start" tick of the kJ axis
  for (const m of marks) {
    if (m.kj > last) break;
    if (last > 0 && (m.kj - prev) / last < minGap) continue;
    out.push({ kj: m.kj, time_s: m.time_s });
    prev = m.kj;
  }
  return out;
}
