import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";

import type { LoadDay } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, gridProps, lineCursor, tooltipContent, TooltipBox, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";

import type { DateTick, LoadPoint } from "../lib/types";
import { LoadTable } from "./LoadTable";

/** The Performance Management Chart: fitness and fatigue lines over daily TSS dots. */
export function FitnessFatigueCard({
  days,
  points,
  tick,
  refetching,
}: {
  days: LoadDay[];
  points: LoadPoint[];
  tick: DateTick;
  refetching: boolean;
}) {
  const c = useColors();
  return (
    <ChartCard
      title="Fitness and fatigue"
      subtitle="Daily TSS (dots), fitness (42-day average) and fatigue (7-day average), all in TSS per day"
      refetching={refetching}
      legend={[
        { label: "Fitness (CTL)", color: c["series-1"] },
        { label: "Fatigue (ATL)", color: c["series-2"] },
        { label: "Daily TSS", color: c["series-3"], shape: "dot" },
      ]}
      table={() => <LoadTable days={days} />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={points} syncId="pmc" margin={CHART_MARGIN}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
          <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} />
          <Tooltip
            cursor={lineCursor(c)}
            content={tooltipContent<LoadPoint>((d) => (
              <TooltipBox
                title={formatFullDay(d.date)}
                rows={[
                  { name: "Fitness", value: num(d.ctl, 1), color: c["series-1"] },
                  { name: "Fatigue", value: num(d.atl, 1), color: c["series-2"] },
                  { name: "Form", value: signed(d.tsb) },
                  { name: "TSS", value: num(d.tss), color: c["series-3"] },
                  ...(d.unscored ? [{ name: "Unscored workouts", value: String(d.unscored) }] : []),
                ]}
              />
            ))}
          />
          <Scatter dataKey="tssDot" fill={c["series-3"]} shape={<TssDot surface={c["surface-1"]} />} isAnimationActive={false} />
          <Line dataKey="atl" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="ctl" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** A day's TSS: a dot ringed in the surface colour so it stands off the lines. */
function TssDot(props: { cx?: number; cy?: number; fill?: string; surface: string }) {
  const { cx, cy, fill, surface } = props;
  if (cx === undefined || cy === undefined || !Number.isFinite(cy)) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke={surface} strokeWidth={1.5} />;
}
