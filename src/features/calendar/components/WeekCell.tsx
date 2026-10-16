import type { Totals } from "@/api";
import { num } from "@/lib/format";

/** The week's totals beside its days; "Rest" for a past week without workouts. */
export function WeekCell({ totals, future }: { totals: Totals | undefined; future: boolean }) {
  return (
    <div className="cal-week" role="gridcell">
      {totals && totals.count ? (
        <dl>
          <dt>Time</dt>
          <dd>{num(totals.moving_hours, 1)} h</dd>
          <dt>Dist.</dt>
          <dd>{num(totals.distance_km)} km</dd>
          <dt>TSS</dt>
          <dd>{num(totals.tss)}</dd>
          <dt>Work</dt>
          <dd>{num(totals.work_kj)} kJ</dd>
        </dl>
      ) : future ? null : (
        <span className="muted small">Rest</span>
      )}
    </div>
  );
}
