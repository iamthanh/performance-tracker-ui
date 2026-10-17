import type { Performance, PerformanceDay } from "@/api";
import { Card, CardHeader } from "@/components";
import { num } from "@/lib/format";

import { change, componentSeries, daysSinceTested, STALE_DAYS, weightShares } from "../lib/performance";
import type { DateTick } from "../lib/types";
import { MiniChart } from "./MiniChart";

/** One small chart per component (each an index, 100 = baseline), with its weight and when it was last tested;
 *  aerobic efficiency alongside (not in the score). */
export function PerformanceComponentsCard({ perf, days, tick }: { perf: Performance; days: PerformanceDay[]; tick: DateTick }) {
  const latest = days[days.length - 1]!;
  const shares = weightShares(perf.weights);
  return (
    <Card label="Performance components">
      <CardHeader
        title="What the score is made of"
        subtitle="Each component as an index (100 = your baseline) of W/kg, each ride's power over its own weight (durability: the share of power kept), its weight in the score, and when you last went near-maximal for it."
      />
      <div className="mini-grid">
        {perf.components.map((k) => {
          const series = componentSeries(days, k.key);
          const since = daysSinceTested(latest.components[k.key].tested, latest.date);
          const stale = since === null || since > STALE_DAYS;
          return (
            <MiniChart
              key={k.key}
              title={k.label}
              note={`${k.description} · ${num(shares[k.key])} % of the score`}
              value={num(latest.components[k.key].index, 1)}
              delta={change(series.map((p) => p.value)).delta}
              status={
                since === null ? "Not tested in the window" : since === 0 ? "Tested today" : `Last tested ${since} day${since === 1 ? "" : "s"} ago`
              }
              stale={stale}
              flag={latest.components[k.key].estimated_weight ? "Rests on an estimated weight (a long gap without weigh-ins)" : undefined}
              data={series}
              baseline
              token="series-1"
              digits={1}
              tick={tick}
              syncId="perf"
            />
          );
        })}
        <MiniChart
          title="Aerobic efficiency"
          note="Median NP ÷ HR of steady rides of an hour or more (42 days) · not in the score"
          value={num(latest.efficiency, 2)}
          delta={change(days.map((d) => d.efficiency)).delta}
          deltaDigits={2}
          data={days.map((d) => ({ date: d.date, value: d.efficiency }))}
          token="series-3"
          digits={2}
          tick={tick}
          syncId="perf"
        />
      </div>
    </Card>
  );
}
