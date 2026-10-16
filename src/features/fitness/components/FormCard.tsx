import { Area, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { LoadDay } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, gridProps, lineCursor, tooltipContent, TooltipBox, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { signed } from "@/lib/format";
import { formStatus } from "@/lib/training";

import type { DateTick, LoadPoint } from "../lib/types";
import { LoadTable } from "./LoadTable";

/** Form (TSB) as an area, blue above zero and red below. */
export function FormCard({
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
  return (
    <ChartCard
      title="Form"
      subtitle="Training stress balance: yesterday's fitness minus fatigue. Above 0 fresh, below 0 fatigued"
      refetching={refetching}
      table={() => <LoadTable days={days} />}
    >
      <FormChart points={points} tick={tick} />
    </ChartCard>
  );
}

function FormChart({ points, tick }: { points: LoadPoint[]; tick: DateTick }) {
  const c = useColors();
  const values = points.map((p) => p.tsb);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  // Fraction of the plot height above zero: colours switch from positive to negative there.
  const split = max === min ? 0.5 : max / (max - min);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={points} syncId="pmc" margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="tsb-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor={c["diverging-pos"]} stopOpacity={0.14} />
            <stop offset={split} stopColor={c["diverging-pos"]} stopOpacity={0.14} />
            <stop offset={split} stopColor={c["diverging-neg"]} stopOpacity={0.14} />
            <stop offset={1} stopColor={c["diverging-neg"]} stopOpacity={0.14} />
          </linearGradient>
          <linearGradient id="tsb-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor={c["diverging-pos"]} />
            <stop offset={split} stopColor={c["diverging-pos"]} />
            <stop offset={split} stopColor={c["diverging-neg"]} />
            <stop offset={1} stopColor={c["diverging-neg"]} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps(c)} />
        <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
        <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} />
        <ReferenceLine y={0} stroke={c.axis} />
        <Tooltip
          cursor={lineCursor(c)}
          content={tooltipContent<LoadPoint>((d) => (
            <TooltipBox
              title={formatFullDay(d.date)}
              rows={[
                { name: "Form", value: signed(d.tsb) },
                { name: "Status", value: formStatus(d.tsb).label },
              ]}
            />
          ))}
        />
        <Area
          dataKey="tsb"
          stroke="url(#tsb-line)"
          strokeWidth={2}
          fill="url(#tsb-fill)"
          baseValue={0}
          isAnimationActive={false}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
