import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useColors } from "@/hooks";
import { formatDay, formatFullDay, type DatedValue } from "@/lib/dates";
import { num } from "@/lib/format";
import type { Token } from "@/lib/theme";

import { axisProps, CHART_MARGIN, gridProps, lineCursor, Y_AXIS_WIDTH } from "./chartProps";
import { TooltipBox } from "./ChartTooltip";
import { tooltipContent } from "./tooltipContent";

/** One value per day as a line (with dots while there are few), e.g. resting heart rate or weight. */
export function DailyLineChart({
  data,
  token,
  unit,
  digits = 0,
  zero = false,
  syncId,
}: {
  data: DatedValue[];
  /** Series colour. */
  token: Token;
  unit: string;
  digits?: number;
  /** Draw a reference line at 0. */
  zero?: boolean;
  /** Charts with the same id share the hover position (matched by date). */
  syncId?: string;
}) {
  const c = useColors();
  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={data} syncId={syncId} syncMethod="value" margin={CHART_MARGIN}>
        <CartesianGrid {...gridProps(c)} />
        <XAxis dataKey="date" {...axisProps(c)} tickFormatter={formatDay} minTickGap={40} />
        <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} />
        {zero ? <ReferenceLine y={0} stroke={c.axis} /> : null}
        <Tooltip
          cursor={lineCursor(c)}
          content={tooltipContent<DatedValue>((p) => (
            <TooltipBox
              title={formatFullDay(p.date)}
              rows={[{ name: "Value", value: `${num(p.value, digits)} ${unit}`.trim(), color: c[token] }]}
            />
          ))}
        />
        <Line
          dataKey="value"
          stroke={c[token]}
          strokeWidth={2}
          dot={data.length < 40 ? { r: 3, fill: c[token], strokeWidth: 0 } : false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
