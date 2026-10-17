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

/** Column heading of a durability step: "From the start", "After 10 kJ/kg". */
export function stepLabel(step: number, unit: Durability["unit"]): string {
  return step === 0 ? "From the start" : `After ${num(step)} ${unit}`;
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
