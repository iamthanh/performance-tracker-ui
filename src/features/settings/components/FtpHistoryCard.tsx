import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ThresholdValue } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, Empty, gridProps, lineCursor, tooltipContent, TooltipBox } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { num } from "@/lib/format";

import { useFtpHistory } from "../hooks/useFtpHistory";

type Point = ReturnType<typeof useFtpHistory>["points"][number];

/** The FTP in effect over time, as steps. */
export function FtpHistoryCard({ values }: { values: ThresholdValue[] }) {
  const c = useColors();
  const { points, yearTicks, tick } = useFtpHistory(values);
  return (
    <ChartCard title="FTP over time" subtitle="The value in effect on each date (automatic and your own)">
      {points.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={CHART_MARGIN}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={yearTicks.length ? yearTicks : undefined}
              {...axisProps(c)}
              tickFormatter={tick}
            />
            <YAxis {...axisProps(c)} width={48} unit=" W" domain={["auto", "auto"]} />
            <Tooltip
              cursor={lineCursor(c)}
              content={tooltipContent<Point>((p) => (
                <TooltipBox
                  title={`From ${formatFullDay(p.date)}`}
                  rows={[{ name: p.origin === "manual" ? "Your FTP" : "Auto FTP", value: `${num(p.value)} W`, color: c["series-1"] }]}
                />
              ))}
            />
            <Line type="stepAfter" dataKey="value" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty title="No FTP yet">Import rides with power, or set your FTP above.</Empty>
      )}
    </ChartCard>
  );
}
