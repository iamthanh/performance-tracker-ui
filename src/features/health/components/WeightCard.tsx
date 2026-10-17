import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";

import { useBody } from "@/api";
import {
  axisProps,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  ErrorState,
  Loading,
  gridProps,
  lineCursor,
  Segmented,
  StatTile,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { addDays, dateTickFormatter, EARLIEST, formatFullDay, today } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import { fromKg, saveWeightUnit, storedWeightUnit, type WeightUnit } from "@/lib/nutrition";

import { between, dayNumber, fromDayNumber, weightPoints, weightStats, withBreaks, type WeightPoint } from "../lib/weight";

type Span = "1y" | "2y" | "all";
const SPANS: { value: Span; label: string }[] = [
  { value: "1y", label: "1 year" },
  { value: "2y", label: "2 years" },
  { value: "all", label: "All time" },
];

/** Every weigh-in (dots) with the week's average (line), on its own range, all time by default: weigh-ins come
 *  and go in spells, so the page's range would often show none. */
export function WeightCard() {
  const c = useColors();
  const end = today();
  const body = useBody({ start_date: EARLIEST, end_date: end });
  const [span, setSpan] = useState<Span>("all");
  const [unit, setUnit] = useState<WeightUnit>(storedWeightUnit);
  const all = useMemo(() => weightPoints(body.data ?? []), [body.data]);
  const start = span === "all" ? (all[0]?.date ?? end) : addDays(end, span === "1y" ? -364 : -729);
  const shown = between(all, start, end);
  const stats = weightStats(shown, unit);
  const lastEver = all[all.length - 1];
  const format = dateTickFormatter(dayNumber(end) - dayNumber(start)); // as the other date charts
  const tick = (d: number) => format(fromDayNumber(d));
  const data = withBreaks(shown.map((p) => ({ ...p, w: fromKg(p.kg, unit), avg: fromKg(p.avgKg, unit) })));

  return (
    <ChartCard
      title="Weight"
      subtitle="Every day's weight (dots) and the average of the week up to it (line): what ride pages use for W/kg, unless you weighed in for the ride"
      refetching={body.isFetching}
      legend={[
        { label: "Weigh-in", color: c["series-1"], shape: "dot" },
        { label: "7-day average", color: c["series-1"] },
      ]}
      actions={
        <>
          <Segmented label="Weight range" value={span} onChange={setSpan} options={SPANS} />
          <Segmented
            label="Weight unit"
            value={unit}
            onChange={(u) => {
              setUnit(u);
              saveWeightUnit(u);
            }}
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
            ]}
          />
        </>
      }
      table={() => <WeightTable points={shown} unit={unit} />}
    >
      {body.isError ? (
        <ErrorState error={body.error} />
      ) : body.isPending ? (
        <Loading label="Loading weigh-ins…" />
      ) : !stats ? (
        <p className="small muted">
          {lastEver
            ? `No weigh-ins in this range: the latest is from ${formatFullDay(lastEver.date)}. Pick “All time”.`
            : "No weigh-ins yet. Import a log with fitness-hub import-weight-csv (or sync a scale through Garmin or Google)."}
        </p>
      ) : (
        <>
          <div className="tiles" style={{ marginBottom: 12 }}>
            <StatTile label="Latest weigh-in" value={num(stats.latest, 1)} unit={unit} hint={formatFullDay(stats.latestDate)} />
            <StatTile label="7-day average" value={num(stats.average, 1)} unit={unit} hint="what a ride that day uses" />
            <StatTile label="Change in this range" value={signed(stats.change, 1)} unit={unit} hint="7-day average, first to last" />
            <StatTile label="Range" value={`${num(stats.low, 1)}–${num(stats.high, 1)}`} unit={unit} hint={`${num(stats.count)} weigh-ins`} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid {...gridProps(c)} />
              <XAxis
                dataKey="day"
                type="number"
                domain={[dayNumber(start), dayNumber(end)]}
                tickFormatter={tick}
                {...axisProps(c)}
                minTickGap={40}
              />
              <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} tickFormatter={(v: number) => num(v)} />
              <Tooltip
                cursor={lineCursor(c)}
                content={tooltipContent<WeightPoint & { w: number; avg: number }>((p) =>
                  p.date ? (
                  <TooltipBox
                    title={formatFullDay(p.date)}
                    rows={[
                      { name: "Weigh-in", value: `${num(p.w, 1)} ${unit}`, color: c["series-1"] },
                      { name: "7-day average", value: `${num(p.avg, 1)} ${unit}` },
                    ]}
                  />
                  ) : null, // a break in the line, not a weigh-in
                )}
              />
              <Scatter dataKey="w" fill={c["series-1"]} shape={<WeighIn opacity={data.length > 200 ? 0.25 : 0.5} />} isAnimationActive={false} />
              <Line dataKey="avg" stroke={c["series-1"]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </ChartCard>
  );
}

/** Table twin, newest first. */
function WeightTable({ points, unit }: { points: WeightPoint[]; unit: WeightUnit }) {
  return (
    <DataTable
      rows={[...points].reverse()}
      rowKey={(p) => p.date}
      columns={[
        { key: "date", header: "Date", cell: (p) => formatFullDay(p.date), headerClassName: "left", cellClassName: "left" },
        { key: "kg", header: `Weigh-in (${unit})`, cell: (p) => num(fromKg(p.kg, unit), 1) },
        { key: "avg", header: `7-day average (${unit})`, cell: (p) => num(fromKg(p.avgKg, unit), 1) },
        { key: "source", header: "Source", cell: (p) => p.source, headerClassName: "left", cellClassName: "left secondary" },
      ]}
    />
  );
}

/** A weigh-in: a small, faint dot, so hundreds of them leave the average line readable. */
function WeighIn({ cx, cy, fill, opacity }: { cx?: number; cy?: number; fill?: string; opacity: number }) {
  if (cx === undefined || cy === undefined || !Number.isFinite(cy)) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill={fill} fillOpacity={opacity} />;
}
