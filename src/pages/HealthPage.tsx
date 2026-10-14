import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api/client";
import { useBody, useDailyMetrics, useSleep, useTrainingLoad } from "../api/hooks";
import type { DailyMetric } from "../api/types";
import { ChartCard, Empty, ErrorState, Loading, Segmented, StatTile, TooltipBox } from "../components/ui";
import { addDays, formatDay, formatFullDay, presetRange, RANGE_PRESETS, today } from "../lib/dates";
import { hoursMinutes, isNum, num, signed } from "../lib/format";
import { axisProps, gridProps, useColors, type Token } from "../lib/theme";
import { useQuery } from "@tanstack/react-query";

const PRESETS = RANGE_PRESETS.filter((p) => ["42d", "90d", "6m", "1y"].includes(p.id));
const SOURCE_PREFERENCE = ["garmin", "google_health"];

type Series = { date: string; value: number }[];

/** One value per day for a metric, from the preferred source that has it. */
function metricSeries(rows: DailyMetric[], metric: string): Series {
  const best = new Map<string, { rank: number; value: number }>();
  for (const r of rows) {
    if (r.metric !== metric) continue;
    const rank = SOURCE_PREFERENCE.indexOf(r.source) === -1 ? 99 : SOURCE_PREFERENCE.indexOf(r.source);
    const current = best.get(r.date);
    if (!current || rank < current.rank) best.set(r.date, { rank, value: r.value });
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v.value }));
}

function average(series: Series, lastDays: number, end: string): number | null {
  const from = addDays(end, -(lastDays - 1));
  const values = series.filter((p) => p.date >= from && p.date <= end).map((p) => p.value);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function HealthPage() {
  const [presetId, setPresetId] = useState("90d");
  const range = presetRange(PRESETS.find((p) => p.id === presetId)!);
  const metrics = useDailyMetrics({ start_date: range.start, end_date: range.end });
  const sleep = useSleep({ start_date: range.start, end_date: range.end });
  const body = useBody({ start_date: range.start, end_date: range.end });
  const load = useTrainingLoad({ start_date: range.start, end_date: range.end });
  const c = useColors();

  const rows = metrics.data ?? [];
  const resting = useMemo(() => metricSeries(rows, "resting_hr"), [rows]);
  const hrv = useMemo(() => metricSeries(rows, "hrv_rmssd_ms"), [rows]);
  const sleepScore = useMemo(() => metricSeries(rows, "sleep_score"), [rows]);
  const weight = useMemo(
    () => (body.data ?? []).filter((b) => b.metric === "weight_kg").map((b) => ({ date: b.ts.slice(0, 10), value: b.value })),
    [body.data],
  );
  const nights = useMemo(
    () =>
      (sleep.data ?? []).map((s) => ({
        date: s.local_date,
        deep: (s.minutes_deep ?? 0) / 60,
        light: (s.minutes_light ?? 0) / 60,
        rem: (s.minutes_rem ?? 0) / 60,
        awake: (s.minutes_awake ?? 0) / 60,
        asleep: s.minutes_asleep,
      })),
    [sleep.data],
  );
  const end = range.end;
  const nothing = !metrics.isPending && !sleep.isPending && !body.isPending && !rows.length && !nights.length && !weight.length;

  if (metrics.isError) {
    return (
      <div className="card">
        <ErrorState error={metrics.error} />
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Health</h1>
          <p>Recovery markers from your watch next to your training load.</p>
        </div>
        <Segmented label="Date range" value={presetId} onChange={setPresetId} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
      </div>

      {metrics.isPending ? (
        <div className="card">
          <Loading />
        </div>
      ) : nothing ? (
        <div className="card">
          <Empty title="No health data in this range">
            Connect Garmin for resting heart rate, HRV, sleep and all-day heart rate: in the backend repo run{" "}
            <code>fitness-hub auth garmin</code>, then <code>fitness-hub sync --source garmin</code>.
          </Empty>
        </div>
      ) : (
        <>
          <div className="tiles">
            <StatTile label="Resting HR · 7-day avg" value={num(average(resting, 7, end))} unit="bpm" hint={trend(resting, end, "bpm")} />
            <StatTile label="HRV · 7-day avg" value={num(average(hrv, 7, end))} unit="ms" hint={trend(hrv, end, "ms")} />
            <StatTile label="Sleep score · 7-day avg" value={num(average(sleepScore, 7, end))} />
            <StatTile
              label="Sleep · 7-night avg"
              value={hoursMinutes((average(nights.map((n) => ({ date: n.date, value: (n.asleep ?? 0) * 60 })), 7, end) ?? NaN))}
            />
            <StatTile label="Weight · latest" value={num(weight[weight.length - 1]?.value, 1)} unit="kg" />
          </div>

          <ChartCard title="Form" subtitle="Training stress balance, for context: recovery markers usually worsen when form is low" refetching={load.isFetching}>
            <SmallLine data={(load.data ?? []).map((d) => ({ date: d.date, value: d.tsb }))} token="series-1" unit="" zero syncId="health" />
          </ChartCard>
          <div className="grid two">
            <MetricCard title="Resting heart rate" unit="bpm" data={resting} token="series-8" />
            <MetricCard title="Heart-rate variability" unit="ms" data={hrv} token="series-7" subtitle="Nightly RMSSD" />
          </div>

          <ChartCard
            title="Sleep"
            subtitle="Hours per night by stage"
            refetching={sleep.isFetching}
            legend={[
              { label: "Deep", color: c["series-1"], shape: "rect" },
              { label: "Light", color: c["series-2"], shape: "rect" },
              { label: "REM", color: c["series-3"], shape: "rect" },
              { label: "Awake", color: c["series-4"], shape: "rect" },
            ]}
            table={() => (
              <table className="data">
                <thead>
                  <tr>
                    <th>Night ending</th>
                    <th>Asleep</th>
                    <th>Deep</th>
                    <th>Light</th>
                    <th>REM</th>
                    <th>Awake</th>
                  </tr>
                </thead>
                <tbody>
                  {[...nights].reverse().map((n) => (
                    <tr key={n.date}>
                      <td>{formatFullDay(n.date)}</td>
                      <td>{hoursMinutes((n.asleep ?? 0) * 60)}</td>
                      <td>{hoursMinutes(n.deep * 3600)}</td>
                      <td>{hoursMinutes(n.light * 3600)}</td>
                      <td>{hoursMinutes(n.rem * 3600)}</td>
                      <td>{hoursMinutes(n.awake * 3600)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          >
            {nights.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={nights} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap={2}>
                  <CartesianGrid {...gridProps(c)} />
                  <XAxis dataKey="date" {...axisProps(c)} tickFormatter={formatDay} minTickGap={40} />
                  <YAxis {...axisProps(c)} width={44} unit=" h" />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.35 }}
                    content={({ active, payload }) => {
                      const n = payload?.[0]?.payload as (typeof nights)[number] | undefined;
                      if (!active || !n) return null;
                      return (
                        <TooltipBox
                          title={`Night ending ${formatFullDay(n.date)}`}
                          rows={[
                            { name: "Deep", value: hoursMinutes(n.deep * 3600), color: c["series-1"] },
                            { name: "Light", value: hoursMinutes(n.light * 3600), color: c["series-2"] },
                            { name: "REM", value: hoursMinutes(n.rem * 3600), color: c["series-3"] },
                            { name: "Awake", value: hoursMinutes(n.awake * 3600), color: c["series-4"] },
                          ]}
                        />
                      );
                    }}
                  />
                  {(["deep", "light", "rem", "awake"] as const).map((k, i) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="sleep"
                      fill={c[(["series-1", "series-2", "series-3", "series-4"] as const)[i]!]}
                      stroke={c["surface-1"]}
                      strokeWidth={2}
                      maxBarSize={24}
                      radius={k === "awake" ? [4, 4, 0, 0] : 0}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty title="No sleep data in this range" />
            )}
          </ChartCard>

          <div className="grid two">
            <MetricCard title="Weight" unit="kg" data={weight} token="series-1" digits={1} />
            <DayHeartRate />
          </div>
        </>
      )}
    </>
  );
}

function trend(series: Series, end: string, unit: string): string | undefined {
  const now = average(series, 7, end);
  const before = average(series, 7, addDays(end, -7));
  if (!isNum(now) || !isNum(before)) return undefined;
  return `${signed(now - before)} ${unit} vs prior week`;
}

function SmallLine({
  data,
  token,
  unit,
  digits = 0,
  zero = false,
  syncId,
}: {
  data: Series;
  token: Token;
  unit: string;
  digits?: number;
  zero?: boolean;
  syncId?: string;
}) {
  const c = useColors();
  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={data} syncId={syncId} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid {...gridProps(c)} />
        <XAxis dataKey="date" {...axisProps(c)} tickFormatter={formatDay} minTickGap={40} />
        <YAxis {...axisProps(c)} width={44} domain={["auto", "auto"]} />
        {zero ? <ReferenceLine y={0} stroke={c.axis} /> : null}
        <Tooltip
          cursor={{ stroke: c.axis, strokeWidth: 1 }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as Series[number] | undefined;
            if (!active || !p) return null;
            return <TooltipBox title={formatFullDay(p.date)} rows={[{ name: "Value", value: `${num(p.value, digits)} ${unit}`.trim(), color: c[token] }]} />;
          }}
        />
        <Line dataKey="value" stroke={c[token]} strokeWidth={2} dot={data.length < 40 ? { r: 3, fill: c[token], strokeWidth: 0 } : false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function MetricCard({
  title,
  subtitle,
  unit,
  data,
  token,
  digits = 0,
}: {
  title: string;
  subtitle?: string;
  unit: string;
  data: Series;
  token: Token;
  digits?: number;
}) {
  return (
    <ChartCard
      title={title}
      subtitle={subtitle ?? unit}
      table={() => (
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>{unit}</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((p) => (
              <tr key={p.date}>
                <td>{formatFullDay(p.date)}</td>
                <td>{num(p.value, digits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    >
      {data.length ? <SmallLine data={data} token={token} unit={unit} digits={digits} syncId="health" /> : <Empty title={`No ${title.toLowerCase()} data in this range`} />}
    </ChartCard>
  );
}

function DayHeartRate() {
  const [day, setDay] = useState(addDays(today(), -1));
  const c = useColors();
  const hr = useQuery({ queryKey: ["heart-rate", day], queryFn: () => api.heartRate(day) });
  const series = Object.values(hr.data?.sources ?? {})[0];
  const data = series
    ? series.time.map((t, i) => ({ t, value: series.heart_rate[i] ?? null })).filter((p) => p.value !== null)
    : [];
  const clock = (t: number) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <ChartCard
      title="All-day heart rate"
      subtitle="From your watch, about every 2 minutes"
      actions={
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          Day
          <input type="date" value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)} />
        </label>
      }
    >
      {hr.isError ? (
        <ErrorState error={hr.error} />
      ) : !data.length ? (
        <Empty title={`No all-day heart rate on ${formatFullDay(day)}`} />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} {...axisProps(c)} />
            <YAxis {...axisProps(c)} width={44} domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: c.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!active || !p) return null;
                return <TooltipBox title={clock(p.t)} rows={[{ name: "Heart rate", value: `${num(p.value)} bpm`, color: c["series-8"] }]} />;
              }}
            />
            <Line dataKey="value" stroke={c["series-8"]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
