import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useSummary, useTrainingLoad } from "../api/hooks";
import type { LoadDay } from "../api/types";
import { ChartCard, Empty, ErrorState, Loading, Segmented, StatTile, TooltipBox } from "../components/ui";
import {
  RANGE_PRESETS,
  addDays,
  daysBetween,
  formatDay,
  formatFullDay,
  formatShortMonth,
  presetRange,
  weekStart,
} from "../lib/dates";
import { num, signed } from "../lib/format";
import { axisProps, gridProps, useColors } from "../lib/theme";
import { formStatus, rampRate, trimLeadingEmpty } from "../lib/training";

type Point = LoadDay & { tssDot: number | null };

function dateTick(spanDays: number) {
  return (iso: string) => (spanDays > 200 ? formatShortMonth(iso) : formatDay(iso));
}

export function FitnessPage() {
  const [presetId, setPresetId] = useState("90d");
  const preset = RANGE_PRESETS.find((p) => p.id === presetId)!;
  const range = presetRange(preset);
  const load = useTrainingLoad({ start_date: range.start, end_date: range.end });
  const weeks = useSummary({ start_date: weekStart(range.start), end_date: range.end, group_by: "week" });
  const c = useColors();

  const days = useMemo(() => trimLeadingEmpty(load.data ?? []), [load.data]);
  const points: Point[] = useMemo(() => days.map((d) => ({ ...d, tssDot: d.tss > 0 ? d.tss : null })), [days]);
  const span = days.length ? daysBetween(days[0]!.date, days[days.length - 1]!.date) : 0;
  const tick = dateTick(span);
  const latest = days[days.length - 1];
  const ramp = rampRate(days);
  const unscored = days.reduce((n, d) => n + d.unscored, 0);
  const weekRows = (weeks.data?.periods ?? []).filter((p) => !days.length || p.period >= weekStart(days[0]!.date));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Fitness</h1>
          <p>Fitness (CTL), fatigue (ATL) and form (TSB) from daily training stress, like the Performance Management Chart.</p>
        </div>
        <Segmented
          label="Date range"
          value={presetId}
          onChange={setPresetId}
          options={RANGE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
      </div>

      {load.isError ? (
        <div className="card">
          <ErrorState error={load.error} />
        </div>
      ) : load.isPending ? (
        <div className="card">
          <Loading />
        </div>
      ) : !latest ? (
        <div className="card">
          <Empty title="No training stress yet">
            Import your Strava export with <code>fitness-hub import-strava-export</code>; the analysis runs at the end.
          </Empty>
        </div>
      ) : (
        <>
          <div className="tiles">
            <StatTile
              hero
              label={`Form (TSB) · ${formatDay(latest.date)}`}
              value={signed(latest.tsb)}
              hint={formStatus(latest.tsb).label}
            />
            <StatTile label="Fitness (CTL)" value={num(latest.ctl, 1)} hint={ramp === null ? undefined : `${signed(ramp)} in 7 days`} />
            <StatTile label="Fatigue (ATL)" value={num(latest.atl, 1)} />
            <StatTile
              label="Last 7 days"
              value={num(days.slice(-7).reduce((t, d) => t + d.tss, 0))}
              unit="TSS"
            />
            <StatTile label={`Since ${formatDay(days[0]!.date)}`} value={num(days.reduce((t, d) => t + d.tss, 0))} unit="TSS" />
          </div>

          {unscored > 0 ? (
            <p className="small secondary" role="note">
              {unscored} workout{unscored === 1 ? "" : "s"} in this range {unscored === 1 ? "has" : "have"} no TSS
              (no per-second data imported), so load is understated on those days.
            </p>
          ) : null}

          <ChartCard
            title="Fitness and fatigue"
            subtitle="Daily TSS (dots), fitness (42-day average) and fatigue (7-day average), all in TSS per day"
            refetching={load.isFetching}
            legend={[
              { label: "Fitness (CTL)", color: c["series-1"] },
              { label: "Fatigue (ATL)", color: c["series-2"] },
              { label: "Daily TSS", color: c["series-3"], shape: "dot" },
            ]}
            table={() => <LoadTable days={days} />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={points} syncId="pmc" margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid {...gridProps(c)} />
                <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
                <YAxis {...axisProps(c)} width={44} />
                <Tooltip
                  cursor={{ stroke: c.axis, strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const d = payload?.[0]?.payload as Point | undefined;
                    if (!active || !d) return null;
                    return (
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
                    );
                  }}
                />
                <Scatter dataKey="tssDot" fill={c["series-3"]} shape={<TssDot surface={c["surface-1"]} />} isAnimationActive={false} />
                <Line dataKey="atl" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="ctl" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Form"
            subtitle="Training stress balance: yesterday's fitness minus fatigue. Above 0 fresh, below 0 fatigued"
            refetching={load.isFetching}
            table={() => <LoadTable days={days} />}
          >
            <FormChart points={points} tick={tick} />
          </ChartCard>

          <ChartCard
            title="Weekly training stress"
            subtitle="Total TSS per week (Monday start)"
            refetching={weeks.isFetching}
            table={() => (
              <table className="data">
                <thead>
                  <tr>
                    <th>Week of</th>
                    <th>TSS</th>
                    <th>Hours</th>
                    <th>Distance</th>
                    <th>Workouts</th>
                  </tr>
                </thead>
                <tbody>
                  {[...weekRows].reverse().map((w) => (
                    <tr key={w.period}>
                      <td>{formatFullDay(w.period)}</td>
                      <td>{num(w.total.tss)}</td>
                      <td>{num(w.total.moving_hours, 1)}</td>
                      <td>{num(w.total.distance_km)} km</td>
                      <td>{w.total.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          >
            {weeks.isError ? (
              <ErrorState error={weeks.error} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekRows.map((w) => ({ week: w.period, tss: Math.round(w.total.tss), hours: w.total.moving_hours }))} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid {...gridProps(c)} />
                  <XAxis dataKey="week" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
                  <YAxis {...axisProps(c)} width={44} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      const d = payload?.[0]?.payload as { week: string; tss: number; hours: number } | undefined;
                      if (!active || !d) return null;
                      return (
                        <TooltipBox
                          title={`Week of ${formatDay(d.week)} – ${formatDay(addDays(d.week, 6))}`}
                          rows={[
                            { name: "TSS", value: num(d.tss), color: c["series-1"] },
                            { name: "Hours", value: num(d.hours, 1) },
                          ]}
                        />
                      );
                    }}
                  />
                  <Bar dataKey="tss" fill={c["series-1"]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </>
      )}
    </>
  );
}

function TssDot(props: { cx?: number; cy?: number; fill?: string; surface: string }) {
  const { cx, cy, fill, surface } = props;
  if (cx === undefined || cy === undefined || !Number.isFinite(cy)) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke={surface} strokeWidth={1.5} />;
}

function FormChart({ points, tick }: { points: Point[]; tick: (iso: string) => string }) {
  const c = useColors();
  const values = points.map((p) => p.tsb);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  // Fraction of the plot height above zero: colours switch from positive to negative there.
  const split = max === min ? 0.5 : max / (max - min);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={points} syncId="pmc" margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
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
        <YAxis {...axisProps(c)} width={44} />
        <ReferenceLine y={0} stroke={c.axis} />
        <Tooltip
          cursor={{ stroke: c.axis, strokeWidth: 1 }}
          content={({ active, payload }) => {
            const d = payload?.[0]?.payload as Point | undefined;
            if (!active || !d) return null;
            return (
              <TooltipBox
                title={formatFullDay(d.date)}
                rows={[
                  { name: "Form", value: signed(d.tsb) },
                  { name: "Status", value: formStatus(d.tsb).label },
                ]}
              />
            );
          }}
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

function LoadTable({ days }: { days: LoadDay[] }) {
  return (
    <table className="data">
      <thead>
        <tr>
          <th>Date</th>
          <th>TSS</th>
          <th>Fitness</th>
          <th>Fatigue</th>
          <th>Form</th>
          <th>Unscored</th>
        </tr>
      </thead>
      <tbody>
        {[...days].reverse().map((d) => (
          <tr key={d.date}>
            <td>{formatFullDay(d.date)}</td>
            <td>{num(d.tss)}</td>
            <td>{num(d.ctl, 1)}</td>
            <td>{num(d.atl, 1)}</td>
            <td>{signed(d.tsb)}</td>
            <td>{d.unscored || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
