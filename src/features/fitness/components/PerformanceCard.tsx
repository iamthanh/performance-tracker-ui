import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Performance, PerformanceDay } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, DataTable, gridProps, lineCursor, StatTile, tooltipContent, TooltipBox, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { formatDay, formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";

import { change, tableDays } from "../lib/performance";
import type { DateTick } from "../lib/types";

/** The performance index over the range: one score, 100 = your baseline. */
export function PerformanceCard({
  perf,
  days,
  tick,
  refetching,
}: {
  perf: Performance;
  days: PerformanceDay[];
  tick: DateTick;
  refetching: boolean;
}) {
  const c = useColors();
  const latest = days[days.length - 1]!;
  const range = change(days.map((d) => d.score));
  const best = days.reduce<PerformanceDay | null>((b, d) => (d.score !== null && (!b || d.score > b.score!) ? d : b), null);
  return (
    <ChartCard
      title="Performance index"
      subtitle={
        <>
          How good you are, from your best efforts over the trailing {perf.window_days} days (100 = your baseline). Fitness below is
          how much you have trained.
        </>
      }
      refetching={refetching}
      table={() => <PerformanceTable perf={perf} days={tableDays(days)} />}
    >
      <div className="tiles" style={{ marginBottom: 12 }}>
        <StatTile hero label={`Performance · ${formatDay(latest.date)}`} value={num(latest.score, 1)} hint="100 = your baseline" />
        <StatTile label="Change in this range" value={signed(range.delta, 1)} hint={range.first !== null ? `from ${num(range.first, 1)}` : undefined} />
        <StatTile label="Best in this range" value={num(best?.score, 1)} hint={best ? formatFullDay(best.date) : undefined} />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={days} syncId="perf" margin={CHART_MARGIN}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
          <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} />
          <ReferenceLine y={100} stroke={c.axis} strokeDasharray="4 3" label={{ value: "baseline", position: "insideTopLeft", fill: c["text-muted"], fontSize: 11 }} />
          <Tooltip
            cursor={lineCursor(c)}
            content={tooltipContent<PerformanceDay>((d) => (
              <TooltipBox
                title={formatFullDay(d.date)}
                rows={[
                  { name: "Performance", value: num(d.score, 1), color: c["series-1"] },
                  ...perf.components.map((k) => ({ name: k.label, value: num(d.components[k.key].index, 1) })),
                ]}
              />
            ))}
          />
          <Line dataKey="score" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Table twin: the score and every component index, newest first. */
function PerformanceTable({ perf, days }: { perf: Performance; days: PerformanceDay[] }) {
  return (
    <DataTable
      rows={[...days].reverse()}
      rowKey={(d) => d.date}
      columns={[
        { key: "date", header: "Date", cell: (d) => formatFullDay(d.date), headerClassName: "left", cellClassName: "left" },
        { key: "score", header: "Score", cell: (d) => num(d.score, 1) },
        ...perf.components.map((k) => ({ key: k.key, header: k.label, cell: (d: PerformanceDay) => num(d.components[k.key].index, 1) })),
        { key: "ef", header: "EF", cell: (d) => num(d.efficiency, 2) },
      ]}
    />
  );
}
