import { useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";

import type { Cardio, CardioDay, CardioModel } from "@/api";
import {
  axisProps,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  gridProps,
  lineCursor,
  Segmented,
  StatTile,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { dateTickFormatter, dayNumber, formatDay, formatFullDay, fromDayNumber } from "@/lib/dates";
import { correctionParts } from "@/lib/cardio";
import { num, signed } from "@/lib/format";

import {
  cardioPoints,
  LOWER_IS_FITTER,
  fitness,
  VIEW_LABELS,
  viewValue,
  weeklyRows,
  type CardioPoint,
  type CardioView,
} from "../lib/cardio";
import { change } from "../lib/performance";

const RESTING_SOURCE = { measured: "measured resting HR", setting: "your resting HR setting", assumed: "resting HR assumed" };

/** Heart rate against power over the range: how many beats your steady riding takes at the reference power (or the
 *  power at the reference heart rate), the cardio score and an estimated VO2max. */
export function CardioCard({ cardio, model, days, refetching }: { cardio: Cardio; model: CardioModel; days: CardioDay[]; refetching: boolean }) {
  const c = useColors();
  const [view, setView] = useState<CardioView>("hr");
  const ref = model.reference;
  const latest = days[days.length - 1]!;
  const labels: Record<CardioView, string> = {
    hr: `HR at ${num(ref.power_w)} W`,
    power: `W at ${num(ref.hr_bpm)} bpm`,
    score: "Score",
    vo2max: "VO2max",
  };
  const units: Record<CardioView, string> = { hr: "bpm", power: "W", score: "", vo2max: "ml/kg/min" };
  const digits = view === "power" ? 0 : 1;
  const range = change(days.map((d) => viewValue(d, view)));
  const direction = fitness(range.delta, view, digits);
  const points = cardioPoints(days, cardio.rides, view);
  const start = points[0]?.date ?? days[0]!.date;
  const end = days[days.length - 1]!.date;
  const tick = dateTickFormatter(dayNumber(end) - dayNumber(start));
  const basis = latest.vo2max_basis;
  const dots = view === "hr" || view === "power";
  return (
    <ChartCard
      title="Cardio fitness"
      subtitle={
        <>
          How hard your heart works for the same power, from steady riding: the median of your rides over the last{" "}
          {cardio.window_days} days, each put on the same footing (the same power and work done, outdoors, {model.corrections.heat_from_c} °C
          or cooler, and fresh, since fatigue lowers heart rate). Fewer beats at {num(ref.power_w)} W, or more watts at{" "}
          {num(ref.hr_bpm)} bpm, is a fitter heart.
        </>
      }
      refetching={refetching}
      legend={
        dots
          ? [
              { label: `${cardio.window_days}-day median`, color: c["series-1"] },
              { label: "A ride (corrected)", color: c["series-1"], shape: "dot" },
            ]
          : undefined
      }
      table={() => <CardioTable days={weeklyRows(days)} model={model} />}
    >
      <div className="tiles" style={{ marginBottom: 12 }}>
        <StatTile
          hero
          label={`HR at ${num(ref.power_w)} W`}
          value={num(latest.hr_at_ref, 1)}
          unit="bpm"
          hint={`${formatDay(latest.date)} · lower is fitter · ${latest.rides} rides in ${cardio.window_days} days`}
        />
        <StatTile label={`Power at ${num(ref.hr_bpm)} bpm`} value={num(latest.power_at_ref)} unit="W" hint="higher is fitter" />
        <StatTile label="Cardio score" value={num(latest.score, 1)} hint="100 = your baseline" />
        <StatTile
          label="Estimated VO2max"
          value={num(latest.vo2max, 1)}
          unit="ml/kg/min"
          hint={basis ? `${RESTING_SOURCE[basis.resting]} ${num(basis.resting_hr)} · max HR ${num(basis.max_hr)}` : "needs your weight and max HR"}
        />
        <StatTile
          label="Change in this range"
          value={signed(range.delta, digits)}
          unit={units[view] || undefined}
          hint={`${labels[view]}${direction ? ` · ${direction}` : range.first !== null ? ` · from ${num(range.first, digits)}` : ""}`}
        />
      </div>
      {/* In the body, not the header: four choices next to Chart / Table do not fit a card's header. */}
      <div className="filters" style={{ marginBottom: 8 }}>
        <Segmented
          label="Cardio measure"
          value={view}
          onChange={setView}
          options={(["hr", "power", "score", "vo2max"] as const).map((v) => ({ value: v, label: VIEW_LABELS[v] }))}
        />
        <span className="small muted">{labels[view]}{LOWER_IS_FITTER[view] ? " · lower is fitter" : " · higher is fitter"}</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={points} margin={CHART_MARGIN}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[dayNumber(start), dayNumber(end)]}
            tickFormatter={(n: number) => tick(fromDayNumber(n))}
            {...axisProps(c)}
            minTickGap={40}
          />
          <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={["auto", "auto"]} tickFormatter={(v: number) => num(v)} />
          {view === "score" ? (
            <ReferenceLine y={100} stroke={c.axis} strokeDasharray="4 3" label={{ value: "baseline", position: "insideTopLeft", fill: c["text-muted"], fontSize: 11 }} />
          ) : null}
          <Tooltip cursor={lineCursor(c)} content={tooltipContent<CardioPoint>((p) => <PointTooltip p={p} view={view} labels={labels} units={units} digits={digits} />)} />
          {dots ? <Scatter dataKey="ride" fill={c["series-1"]} shape={<RideDot />} isAnimationActive={false} /> : null}
          <Line dataKey="value" stroke={c["series-1"]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function PointTooltip({
  p,
  view,
  labels,
  units,
  digits,
}: {
  p: CardioPoint;
  view: CardioView;
  labels: Record<CardioView, string>;
  units: Record<CardioView, string>;
  digits: number;
}) {
  const c = useColors();
  const unit = units[view] ? ` ${units[view]}` : "";
  return (
    <TooltipBox
      title={formatFullDay(p.date)}
      rows={[
        { name: labels[view], value: `${num(p.value, digits)}${unit}`, color: c["series-1"] },
        ...p.rides.map((r) => ({
          name: r.name ?? "Ride",
          value: `${num(view === "power" ? r.power_w : r.bpm, digits)}${view === "power" ? " W" : " bpm"}${
            correctionParts(r).length ? ` (${correctionParts(r).join(", ")})` : ""
          }`,
        })),
        ...(p.source?.tsb != null ? [{ name: "Form (TSB)", value: signed(p.source.tsb, 0) }] : []),
      ]}
    />
  );
}

/** A ride's corrected value: a small dot, so a season of them leaves the line readable. */
function RideDot({ cx, cy, fill }: { cx?: number; cy?: number; fill?: string }) {
  if (cx === undefined || cy === undefined || !Number.isFinite(cy)) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill={fill} fillOpacity={0.45} />;
}

/** Table twin, newest first. */
function CardioTable({ days, model }: { days: CardioDay[]; model: CardioModel }) {
  return (
    <DataTable
      rows={[...days].reverse()}
      rowKey={(d) => d.date}
      columns={[
        { key: "date", header: "Date", cell: (d) => formatFullDay(d.date), headerClassName: "left", cellClassName: "left" },
        { key: "hr", header: `HR at ${num(model.reference.power_w)} W`, cell: (d) => num(d.hr_at_ref, 1) },
        { key: "power", header: `W at ${num(model.reference.hr_bpm)} bpm`, cell: (d) => num(d.power_at_ref) },
        { key: "score", header: "Score", cell: (d) => num(d.score, 1) },
        { key: "vo2max", header: "VO2max", cell: (d) => num(d.vo2max, 1) },
        { key: "rides", header: "Rides", cell: (d) => num(d.rides) },
        { key: "tsb", header: "TSB", cell: (d) => signed(d.tsb, 0) },
      ]}
    />
  );
}
