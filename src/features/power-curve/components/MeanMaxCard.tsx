import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisProps, ChartCard, gridProps, lineCursor, tooltipContent, TooltipBox, type TooltipRow } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { durationLabel, isNum, num } from "@/lib/format";

import { DURATION_TICKS } from "../lib/ranges";
import type { CurveChartPoint, CurveRow } from "../lib/types";
import { CurveTable } from "./CurveTable";

/** The mean-maximal power curve of one range, or two compared, on a log time axis. */
export function MeanMaxCard({
  rows,
  points,
  labelA,
  labelB,
  showB,
  refetching,
}: {
  rows: CurveRow[];
  points: CurveChartPoint[];
  labelA: string;
  labelB: string;
  showB: boolean;
  refetching: boolean;
}) {
  const c = useColors();
  const tooltipRow = (label: string, watts: number | null, best: CurveRow["a"], color: string): TooltipRow => ({
    name: `${label}${best ? ` (${formatFullDay(best.local_date)})` : ""}`,
    value: isNum(watts) ? `${num(watts)} W` : "—",
    color,
  });
  return (
    <ChartCard
      title="Mean-maximal power"
      subtitle="Log time axis: sprints on the left, endurance on the right"
      refetching={refetching}
      legend={[
        { label: labelA, color: c["series-1"] },
        ...(showB ? [{ label: labelB, color: c["series-2"] }] : []),
      ]}
      table={() => <CurveTable rows={rows} labelA={labelA} labelB={labelB} />}
    >
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -4 }}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis
            dataKey="d"
            type="number"
            scale="log"
            domain={["dataMin", "dataMax"]}
            ticks={DURATION_TICKS.filter((t) => t <= (points[points.length - 1]?.d ?? 0))}
            tickFormatter={durationLabel}
            {...axisProps(c)}
          />
          <YAxis {...axisProps(c)} width={48} unit=" W" />
          <Tooltip
            cursor={lineCursor(c)}
            content={tooltipContent<CurveChartPoint>((p) => {
              const row = rows.find((r) => r.d === p.d);
              return (
                <TooltipBox
                  title={`Best ${durationLabel(p.d)}`}
                  rows={[
                    tooltipRow(labelA, p.a, row?.a ?? null, c["series-1"]),
                    ...(showB ? [tooltipRow(labelB, p.b, row?.b ?? null, c["series-2"])] : []),
                  ]}
                />
              );
            })}
          />
          {showB ? <Line dataKey="b" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} /> : null}
          <Line dataKey="a" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
