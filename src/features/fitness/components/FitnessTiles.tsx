import type { LoadDay } from "@/api";
import { StatTile } from "@/components";
import { formatDay, formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import { formStatus } from "@/lib/training";

export function FitnessTiles({ days, latest, ramp }: { days: LoadDay[]; latest: LoadDay; ramp: number | null }) {
  return (
    <div className="tiles">
      <StatTile
        hero
        label={`Form (TSB) · ${formatDay(latest.date)}`}
        value={signed(latest.tsb)}
        hint={formStatus(latest.tsb).label}
      />
      <StatTile label="Fitness (CTL)" value={num(latest.ctl, 1)} hint={ramp === null ? undefined : `${signed(ramp)} in 7 days`} />
      <StatTile label="Fatigue (ATL)" value={num(latest.atl, 1)} />
      <StatTile label="Last 7 days" value={num(days.slice(-7).reduce((t, d) => t + d.tss, 0))} unit="TSS" />
      <StatTile label={`Since ${formatFullDay(days[0]!.date)}`} value={num(days.reduce((t, d) => t + d.tss, 0))} unit="TSS" />
    </div>
  );
}
