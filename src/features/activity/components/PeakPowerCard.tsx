import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { usePowerCurve, type ActivityDetail } from "@/api";
import {
  axisProps,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  gridProps,
  lineCursor,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { addDays } from "@/lib/dates";
import { durationLabel, isNum, num } from "@/lib/format";

const TICKS = [1, 5, 15, 60, 300, 1200, 3600, 10800];

type Point = { d: number; ride: number; best: number | null };

/** This ride's power curve against the rider's best of the 90 days up to it. */
export function PeakPowerCard({ detail }: { detail: ActivityDetail }) {
  const c = useColors();
  const day = detail.activity.local_date;
  const best = usePowerCurve({ start_date: addDays(day, -89), end_date: day }, true, false);
  const bestBy = new Map((best.data ?? []).map((p) => [p.duration_s, p.watts]));
  const data: Point[] = detail.analysis!.power_curve.map((p) => ({
    d: p.duration_s,
    ride: p.watts,
    best: bestBy.get(p.duration_s) ?? null,
  }));
  const watts = (w: number | null) => (isNum(w) ? `${num(w)} W` : "—");
  return (
    <ChartCard
      title="Peak power"
      subtitle="This ride's best power per duration vs your best of the 90 days up to it"
      legend={[
        { label: "This ride", color: c["series-1"] },
        { label: "90-day best", color: c["series-2"] },
      ]}
      table={() => (
        <DataTable
          rows={data}
          rowKey={(p) => p.d}
          columns={[
            { key: "d", header: "Duration", cell: (p) => durationLabel(p.d) },
            { key: "ride", header: "This ride", cell: (p) => `${num(p.ride)} W` },
            { key: "best", header: "90-day best", cell: (p) => watts(p.best) },
          ]}
        />
      )}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis
            dataKey="d"
            type="number"
            scale="log"
            domain={["dataMin", "dataMax"]}
            ticks={TICKS.filter((t) => t <= (data[data.length - 1]?.d ?? 0))}
            tickFormatter={durationLabel}
            {...axisProps(c)}
          />
          <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} />
          <Tooltip
            cursor={lineCursor(c)}
            content={tooltipContent<Point>((p) => (
              <TooltipBox
                title={`Best ${durationLabel(p.d)}`}
                rows={[
                  { name: "This ride", value: `${num(p.ride)} W`, color: c["series-1"] },
                  { name: "90-day best", value: watts(p.best), color: c["series-2"] },
                ]}
              />
            ))}
          />
          <Line dataKey="best" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="ride" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
