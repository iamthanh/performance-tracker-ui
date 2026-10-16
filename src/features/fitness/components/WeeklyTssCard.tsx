import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SummaryPeriod } from "@/api";
import {
  axisProps,
  barCursor,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  ErrorState,
  gridProps,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { addDays, formatDay, formatFullDay } from "@/lib/dates";
import { num } from "@/lib/format";

import type { DateTick } from "../lib/types";

type WeekBar = { week: string; tss: number; hours: number };

/** Total TSS per week as bars. */
export function WeeklyTssCard({
  weeks,
  error,
  tick,
  refetching,
}: {
  weeks: SummaryPeriod[];
  error: unknown;
  tick: DateTick;
  refetching: boolean;
}) {
  const c = useColors();
  return (
    <ChartCard
      title="Weekly training stress"
      subtitle="Total TSS per week (Monday start)"
      refetching={refetching}
      table={() => <WeeklyTable weeks={weeks} />}
    >
      {error ? (
        <ErrorState error={error} />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={weeks.map((w): WeekBar => ({ week: w.period, tss: Math.round(w.total.tss), hours: w.total.moving_hours }))}
            margin={CHART_MARGIN}
          >
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="week" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
            <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} />
            <Tooltip
              cursor={barCursor(c, 0.4)}
              content={tooltipContent<WeekBar>((d) => (
                <TooltipBox
                  title={`Week of ${formatDay(d.week)} – ${formatDay(addDays(d.week, 6))}`}
                  rows={[
                    { name: "TSS", value: num(d.tss), color: c["series-1"] },
                    { name: "Hours", value: num(d.hours, 1) },
                  ]}
                />
              ))}
            />
            <Bar dataKey="tss" fill={c["series-1"]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function WeeklyTable({ weeks }: { weeks: SummaryPeriod[] }) {
  return (
    <DataTable
      rows={[...weeks].reverse()}
      rowKey={(w) => w.period}
      columns={[
        { key: "week", header: "Week of", cell: (w) => formatFullDay(w.period) },
        { key: "tss", header: "TSS", cell: (w) => num(w.total.tss) },
        { key: "hours", header: "Hours", cell: (w) => num(w.total.moving_hours, 1) },
        { key: "distance", header: "Distance", cell: (w) => `${num(w.total.distance_km)} km` },
        { key: "count", header: "Workouts", cell: (w) => w.total.count },
      ]}
    />
  );
}
