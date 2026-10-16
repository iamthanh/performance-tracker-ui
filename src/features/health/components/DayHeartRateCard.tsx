import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useHeartRate } from "@/api";
import {
  axisProps,
  CHART_MARGIN,
  ChartCard,
  Empty,
  ErrorState,
  Field,
  gridProps,
  lineCursor,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { addDays, formatFullDay, today } from "@/lib/dates";
import { num } from "@/lib/format";

type Sample = { t: number; value: number | null };

const clock = (t: number) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** A chosen day's heart rate from the watch (yesterday by default: today is still incomplete). */
export function DayHeartRateCard() {
  const [day, setDay] = useState(addDays(today(), -1));
  const c = useColors();
  const hr = useHeartRate(day);
  const series = Object.values(hr.data?.sources ?? {})[0];
  const data: Sample[] = series
    ? series.time.map((t, i) => ({ t, value: series.heart_rate[i] ?? null })).filter((p) => p.value !== null)
    : [];
  return (
    <ChartCard
      title="All-day heart rate"
      subtitle="From your watch, about every 2 minutes"
      actions={
        <Field inline label="Day" style={{ gap: 6 }}>
          <input type="date" value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)} />
        </Field>
      }
    >
      {hr.isError ? (
        <ErrorState error={hr.error} />
      ) : !data.length ? (
        <Empty title={`No all-day heart rate on ${formatFullDay(day)}`} />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} {...axisProps(c)} />
            <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} />
            <Tooltip
              cursor={lineCursor(c)}
              content={tooltipContent<Sample>((p) => (
                <TooltipBox title={clock(p.t)} rows={[{ name: "Heart rate", value: `${num(p.value)} bpm`, color: c["series-8"] }]} />
              ))}
            />
            <Line dataKey="value" stroke={c["series-8"]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
