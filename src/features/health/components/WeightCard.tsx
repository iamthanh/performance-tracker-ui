import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";

import { useWeight } from "@/api";
import {
  axisProps,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  ErrorState,
  gridProps,
  lineCursor,
  Loading,
  Segmented,
  StatTile,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { addDays, dateTickFormatter, formatFullDay, today } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import { fromKg, saveWeightUnit, storedWeightUnit, type WeightUnit } from "@/lib/nutrition";

import { chartPoints, dayNumber, fromDayNumber, KIND_LABEL, tableRows, weightStats, type WeightPoint, type WeightRow } from "../lib/weight";

type Span = "1y" | "2y" | "3y" | "5y" | "all";
const SPANS: { value: Span; label: string; days?: number }[] = [
  { value: "1y", label: "1 year", days: 365 },
  { value: "2y", label: "2 years", days: 730 },
  { value: "3y", label: "3 years", days: 1096 },
  { value: "5y", label: "5 years", days: 1826 },
  { value: "all", label: "All time" },
];

/** Raw weigh-ins (dots) and the trend weight rides use (line): solid where it rests on weigh-ins around it,
 *  dashed where it is a guess across a long gap or carried past the last weigh-in. Own range, all time by default:
 *  weigh-ins come in spells the page's range often misses. */
export function WeightCard() {
  const c = useColors();
  const end = today();
  const weight = useWeight();
  const [span, setSpan] = useState<Span>("all");
  const [unit, setUnit] = useState<WeightUnit>(storedWeightUnit);
  const all = useMemo(() => weight.data?.days ?? [], [weight.data]);
  const days = SPANS.find((x) => x.value === span)?.days;
  const start = days ? addDays(end, -(days - 1)) : (all[0]?.date ?? end);
  const shown = all.filter((d) => d.date >= start && d.date <= end);
  const stats = weightStats(shown, unit);
  const lastEver = [...all].reverse().find((d) => d.weigh_in !== null);
  const format = dateTickFormatter(dayNumber(end) - dayNumber(start));
  const data = chartPoints(shown, unit);
  const filled = stats ? stats.counts.interpolated + stats.counts.estimated + stats.counts.carried : 0;

  return (
    <ChartCard
      title="Weight"
      subtitle="Dots are your measured weights (a day's mean when you weighed in more than once; pre-ride weights included). The line is the smoothed trend that ride pages use for W/kg: solid where weigh-ins surround it, dashed where it is a guess (a gap of over 6 weeks, or carried past your last weigh-in). Nothing filled in is stored."
      refetching={weight.isFetching}
      legend={[
        { label: "Weigh-in (measured)", color: c["series-1"], shape: "dot" },
        { label: "Trend", color: c["series-1"] },
        { label: "Trend, estimated or carried", color: c["text-muted"] },
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
      table={() => <WeightTable rows={tableRows(shown)} unit={unit} />}
    >
      {weight.isError ? (
        <ErrorState error={weight.error} />
      ) : weight.isPending ? (
        <Loading label="Loading weigh-ins…" />
      ) : !stats ? (
        <p className="small muted">
          {lastEver
            ? `No weight in this range: the latest weigh-in is from ${formatFullDay(lastEver.date)}. Pick “All time”.`
            : "No weigh-ins yet. Import a log with fitness-hub import-weight-csv (or sync a scale through Garmin or Google)."}
        </p>
      ) : (
        <>
          <div className="tiles" style={{ marginBottom: 12 }}>
            <StatTile
              label="Latest weigh-in"
              value={num(stats.latestWeighIn, 1)}
              unit={unit}
              hint={stats.latestWeighInDate ? `measured ${formatFullDay(stats.latestWeighInDate)}` : "none in this range"}
            />
            <StatTile
              label="Latest trend"
              value={num(stats.trend, 1)}
              unit={unit}
              hint={`${formatFullDay(stats.trendDate)} · ${stats.trendKind === "weigh_in" ? "a weigh-in day" : KIND_LABEL[stats.trendKind].toLowerCase()}`}
            />
            <StatTile label="Change in this range" value={signed(stats.change, 1)} unit={unit} hint="trend, first to last day" />
            <StatTile
              label="Measured days"
              value={num(stats.counts.weigh_in)}
              hint={`${num(filled)} filled: ${num(stats.counts.interpolated)} interpolated, ${num(stats.counts.estimated)} estimated, ${num(stats.counts.carried)} carried`}
            />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid {...gridProps(c)} />
              <XAxis
                dataKey="day"
                type="number"
                domain={[dayNumber(start), dayNumber(end)]}
                tickFormatter={(n: number) => format(fromDayNumber(n))}
                {...axisProps(c)}
                minTickGap={40}
              />
              <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} tickFormatter={(v: number) => num(v)} />
              <Tooltip
                cursor={lineCursor(c)}
                content={tooltipContent<WeightPoint>((p) => (
                  <TooltipBox
                    title={`${formatFullDay(p.date)} · ${KIND_LABEL[p.kind]}`}
                    rows={[
                      ...(p.raw !== null
                        ? [
                            {
                              name: p.readings > 1 ? `Measured (mean of ${p.readings})` : "Measured",
                              value: `${num(p.raw, 1)} ${unit}`,
                              color: c["series-1"],
                            },
                          ]
                        : []),
                      { name: p.kind === "weigh_in" ? "Trend" : "Trend (filled)", value: `${num(p.trend, 1)} ${unit}` },
                      ...(p.kind !== "weigh_in" ? [{ name: p.kind === "carried" ? "Since last weigh-in" : "Gap", value: `${p.gap} days` }] : []),
                    ]}
                  />
                ))}
              />
              <Scatter dataKey="raw" fill={c["series-1"]} shape={<WeighIn opacity={data.length > 400 ? 0.3 : 0.55} />} isAnimationActive={false} />
              <Line dataKey="solid" stroke={c["series-1"]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              <Line
                dataKey="dashed"
                stroke={c["text-muted"]}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </ChartCard>
  );
}

/** A weigh-in: a small dot, so hundreds of them leave the trend readable. */
function WeighIn({ cx, cy, fill, opacity }: { cx?: number; cy?: number; fill?: string; opacity: number }) {
  if (cx === undefined || cy === undefined || !Number.isFinite(cy)) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill={fill} fillOpacity={opacity} />;
}

/** Table twin, newest first: every weigh-in as measured, and each stretch of filled days as one row. */
function WeightTable({ rows, unit }: { rows: WeightRow[]; unit: WeightUnit }) {
  const show = (kg: number) => num(fromKg(kg, unit), 1);
  return (
    <DataTable
      rows={[...rows].reverse()}
      rowKey={(r) => (r.type === "weigh_in" ? r.date : `${r.from}/${r.kind}`)}
      columns={[
        {
          key: "date",
          header: "Date",
          cell: (r) => (r.type === "weigh_in" ? formatFullDay(r.date) : `${formatFullDay(r.from)} – ${formatFullDay(r.to)}`),
          headerClassName: "left",
          cellClassName: "left",
        },
        {
          key: "kind",
          header: "Value",
          cell: (r) => (r.type === "weigh_in" ? "Measured" : `${KIND_LABEL[r.kind]}, ${r.days} day${r.days === 1 ? "" : "s"}`),
          headerClassName: "left",
          cellClassName: "left secondary",
        },
        { key: "raw", header: `Weigh-in (${unit})`, cell: (r) => (r.type === "weigh_in" ? show(r.raw) : "—") },
        { key: "trend", header: `Trend (${unit})`, cell: (r) => (r.type === "weigh_in" ? show(r.trend) : "filled") },
        {
          key: "gap",
          header: "Gap",
          cell: (r) => (r.type === "filled" ? `${r.gap} days${r.kind === "carried" ? " since" : ""}` : ""),
        },
      ]}
    />
  );
}
