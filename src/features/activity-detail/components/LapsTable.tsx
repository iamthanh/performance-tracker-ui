import type { Lap } from "@/api";
import { Card, CardHeader, DataTable, type Column } from "@/components";
import { duration, isNum, km, num, withUnit } from "@/lib/format";

/** One row per lap; power and cadence columns only when laps have them. */
export function LapsTable({ laps, running }: { laps: Lap[]; running: boolean }) {
  const hasPower = laps.some((lap) => isNum(lap.avg_power));
  const hasCadence = laps.some((lap) => isNum(lap.avg_cadence));
  const columns: Column<Lap>[] = [
    { key: "lap", header: "Lap", cell: (_, i) => i + 1 },
    { key: "time", header: "Time", cell: (lap) => duration(lap.total_timer_time ?? lap.total_elapsed_time) },
    { key: "distance", header: "Distance", cell: (lap) => km(lap.total_distance, 2) },
    ...(hasPower
      ? [
          { key: "avg_power", header: "Avg power", cell: (lap: Lap) => withUnit(lap.avg_power, "W") },
          { key: "np", header: "NP", cell: (lap: Lap) => withUnit(lap.normalized_power, "W") },
          { key: "max_power", header: "Max power", cell: (lap: Lap) => withUnit(lap.max_power, "W") },
        ]
      : []),
    { key: "hr", header: "Avg HR", cell: (lap) => num(lap.avg_heart_rate) },
    ...(hasCadence
      ? [
          {
            key: "cadence",
            header: "Cadence",
            // Running cadence is recorded per leg: show steps per minute.
            cell: (lap: Lap) => num(isNum(lap.avg_cadence) && running ? lap.avg_cadence * 2 : lap.avg_cadence),
          },
        ]
      : []),
    { key: "ascent", header: "Ascent", cell: (lap) => withUnit(lap.total_ascent, "m") },
  ];
  return (
    <Card label="Laps">
      <CardHeader title="Laps" />
      <div className="table-wrap">
        <DataTable columns={columns} rows={laps} rowKey={(_, i) => i} />
      </div>
    </Card>
  );
}
