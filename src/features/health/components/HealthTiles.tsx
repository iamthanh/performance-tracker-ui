import { StatTile } from "@/components";
import type { DatedValue, ISODate } from "@/lib/dates";
import { hoursMinutes, num } from "@/lib/format";

import type { Night } from "../lib/types";
import { average, weekOverWeek } from "../lib/series";

/** Last 7 days' averages of each marker, and the latest weight. */
export function HealthTiles({
  end,
  resting,
  hrv,
  sleepScore,
  nights,
  weight,
}: {
  end: ISODate;
  resting: DatedValue[];
  hrv: DatedValue[];
  sleepScore: DatedValue[];
  nights: Night[];
  weight: DatedValue[];
}) {
  const sleepSeconds = nights.map((n) => ({ date: n.date, value: (n.asleep ?? 0) * 60 }));
  return (
    <div className="tiles">
      <StatTile label="Resting HR · 7-day avg" value={num(average(resting, 7, end))} unit="bpm" hint={weekOverWeek(resting, end, "bpm")} />
      <StatTile label="HRV · 7-day avg" value={num(average(hrv, 7, end))} unit="ms" hint={weekOverWeek(hrv, end, "ms")} />
      <StatTile label="Sleep score · 7-day avg" value={num(average(sleepScore, 7, end))} />
      <StatTile label="Sleep · 7-night avg" value={hoursMinutes(average(sleepSeconds, 7, end) ?? NaN)} />
      <StatTile label="Weight · latest" value={num(weight[weight.length - 1]?.value, 1)} unit="kg" />
    </div>
  );
}
