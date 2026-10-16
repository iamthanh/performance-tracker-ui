import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisProps, gridProps, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { elapsedLabel } from "@/lib/format";

import type { ChannelSpec, StreamRow } from "../lib/channels";

/** One channel over the workout. Charts share the hover position (syncId); only the last shows the time axis. */
export function StreamChart({
  channel: ch,
  rows,
  showTimeAxis,
  onMouseMove,
  onMouseLeave,
}: {
  channel: ChannelSpec;
  rows: StreamRow[];
  showTimeAxis: boolean;
  onMouseMove: (state: { activeTooltipIndex?: number | string | null }) => void;
  onMouseLeave: () => void;
}) {
  const c = useColors();
  const elevation = ch.key === "altitude";
  return (
    <div className="stream-chart">
      <div className="stream-label">
        {ch.label} <span className="muted">({ch.unit})</span>
      </div>
      <ResponsiveContainer width="100%" height={elevation ? 110 : 130}>
        <ComposedChart
          data={rows}
          syncId="workout"
          margin={{ top: 4, right: 12, bottom: 0, left: -8 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid {...gridProps(c)} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            {...axisProps(c)}
            tickFormatter={elapsedLabel}
            hide={!showTimeAxis}
          />
          <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={elevation ? ["auto", "auto"] : [0, "auto"]} />
          {/* The readout above the charts shows the values; the tooltip only draws the cursor. */}
          <Tooltip cursor={{ stroke: c["text-muted"], strokeWidth: 1 }} content={() => null} />
          {elevation ? (
            <Area
              dataKey={ch.key}
              stroke={c["text-muted"]}
              strokeWidth={1.5}
              fill={c["text-muted"]}
              fillOpacity={0.12}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ) : (
            <Line dataKey={ch.key} stroke={c[ch.token]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
