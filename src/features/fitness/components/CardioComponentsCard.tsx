import type { Cardio, CardioComponent, CardioDay, CardioScored } from "@/api";
import { Card, CardHeader } from "@/components";
import { dateTickFormatter, daysBetween } from "@/lib/dates";
import { num } from "@/lib/format";
import type { Token } from "@/lib/theme";

import { change } from "../lib/performance";
import { MiniChart } from "./MiniChart";

const EMPTY: Partial<Record<CardioComponent, string>> = {
  resting_hr: "No resting heart rate yet. It comes from your watch through the Garmin (or Google Health) sync.",
  hr_recovery: "No recoveries in this range: it needs a hard effort (near threshold) followed by easy spinning or coasting.",
  drift: "No long steady rides in this range (an hour or more of steady blocks).",
};
const TOKENS: Record<CardioComponent, Token> = { aerobic: "series-1", resting_hr: "series-2", hr_recovery: "series-3", drift: "series-4" };

/** One small chart per component: the scored ones as an index (100 = your baseline, up = fitter), drift as its value. */
export function CardioComponentsCard({ cardio, days }: { cardio: Cardio; days: CardioDay[] }) {
  const latest = days[days.length - 1]!;
  const tick = dateTickFormatter(daysBetween(days[0]!.date, latest.date));
  // As the score: over the scored components with a value today (resting HR waits for the watch).
  const present = (Object.keys(cardio.weights) as CardioScored[]).filter((k) => latest.components[k].index !== null);
  const total = present.reduce((t, k) => t + cardio.weights[k], 0) || 1;
  return (
    <Card label="Cardio components">
      <CardHeader
        title="What the cardio score is made of"
        subtitle="Each scored component as an index, 100 = your first year of data and up = fitter (resting heart rate is turned around, so a lower one scores higher), with its value and its weight in the score."
      />
      <div className="mini-grid">
        {cardio.components.map((k) => {
          const scored = k.scored;
          const series = days.map((d) => ({ date: d.date, value: scored ? d.components[k.key].index : d.components[k.key].value }));
          const value = latest.components[k.key].value;
          const hasAny = series.some((p) => p.value !== null);
          const share = scored ? (present.includes(k.key as CardioScored) ? (cardio.weights[k.key as CardioScored] / total) * 100 : 0) : null;
          return (
            <MiniChart
              key={k.key}
              title={k.label}
              note={`${k.description} · now ${num(value, k.unit === "W" ? 0 : 1)} ${k.unit}${
                share !== null ? ` · ${num(share)} % of the score` : ""
              }${k.lower_is_better ? " · lower is fitter" : ""}`}
              value={num(scored ? latest.components[k.key].index : value, scored ? 1 : 2)}
              delta={change(series.map((p) => p.value)).delta}
              data={series}
              baseline={scored}
              token={TOKENS[k.key]}
              digits={scored ? 1 : 2}
              tick={tick}
              syncId="cardio"
              empty={hasAny ? undefined : EMPTY[k.key] ?? "No values in this range."}
            />
          );
        })}
      </div>
    </Card>
  );
}
