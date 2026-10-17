import type { Totals } from "@/api";
import { StatTile } from "@/components";
import { num } from "@/lib/format";

export function MonthTotals({
  totals,
  energy,
  refetching,
}: {
  totals: Totals;
  /** Average kcal per day, when any is known. */
  energy: { eaten: number | null; burned: number | null };
  refetching: boolean;
}) {
  return (
    <div className={refetching ? "tiles refetching" : "tiles"}>
      <StatTile label="Workouts" value={String(totals.count)} />
      <StatTile label="Time" value={num(totals.moving_hours, 1)} unit="h" />
      <StatTile label="Distance" value={num(totals.distance_km)} unit="km" />
      <StatTile label="Elevation" value={num(totals.elevation_gain_m)} unit="m" />
      <StatTile label="TSS" value={num(totals.tss)} hint={totals.unscored ? `${totals.unscored} without TSS` : undefined} />
      <StatTile label="Work" value={num(totals.work_kj)} unit="kJ" />
      <StatTile label="Workout calories" value={totals.kcal ? num(totals.kcal) : "—"} unit="kcal" />
      {energy.eaten !== null ? <StatTile label="Eaten / day" value={num(energy.eaten)} unit="kcal" hint="Logged days" /> : null}
      {energy.burned !== null ? <StatTile label="Burned / day" value={num(energy.burned)} unit="kcal" /> : null}
    </div>
  );
}
