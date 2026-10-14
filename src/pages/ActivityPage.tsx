import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useActivity, usePowerCurve, useStreams } from "../api/hooks";
import type { ActivityDetail, Channel, CurvePoint, Lap, Streams, Zone } from "../api/types";
import { ChartCard, Empty, ErrorState, Loading, StatTile, TooltipBox } from "../components/ui";
import { addDays, formatFullDay } from "../lib/dates";
import { duration, durationLabel, isNum, km, num, pct, sportLabel, withUnit } from "../lib/format";
import { axisProps, gridProps, useColors, type Token } from "../lib/theme";
import { RouteMap } from "../components/RouteMap";

type ChannelSpec = { key: Channel; label: string; unit: string; token: Token; digits: number; scale?: number };

// Each channel is its own chart (different units never share an axis); identity colour is fixed per channel.
const CHANNELS: ChannelSpec[] = [
  { key: "power", label: "Power", unit: "W", token: "series-1", digits: 0 },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", token: "series-8", digits: 0 },
  { key: "cadence", label: "Cadence", unit: "rpm", token: "series-3", digits: 0 },
  { key: "speed", label: "Speed", unit: "km/h", token: "series-7", digits: 1, scale: 3.6 },
  { key: "altitude", label: "Elevation", unit: "m", token: "text-muted", digits: 0 },
];

export function ActivityPage() {
  const { source = "", id = "" } = useParams();
  const detail = useActivity(source, id);
  const hasStreams = !!detail.data?.streams;
  const streams = useStreams(source, id, hasStreams);

  if (detail.isError) {
    return (
      <div className="card">
        <ErrorState error={detail.error} />
      </div>
    );
  }
  if (detail.isPending) {
    return (
      <div className="card">
        <Loading />
      </div>
    );
  }
  const d = detail.data;
  return (
    <>
      <Header detail={d} />
      <Tiles detail={d} />
      {!hasStreams ? (
        <div className="card">
          <Empty title="No per-second data for this workout">
            Only its summary was synced. Import your Strava export to get charts, zones and TSS.
          </Empty>
        </div>
      ) : streams.isError ? (
        <div className="card">
          <ErrorState error={streams.error} />
        </div>
      ) : streams.isPending ? (
        <div className="card">
          <Loading label="Loading charts…" />
        </div>
      ) : (
        <StreamCharts streams={streams.data} running={d.activity.sport === "running" || d.activity.sport === "walking" || d.activity.sport === "hiking"} />
      )}
      <div className="grid two">
        {d.analysis?.power_zones ? (
          <ZoneCard title="Time in power zones" zones={d.analysis.power_zones} unit="W" threshold={`FTP ${num(d.analysis.ftp_w)} W`} />
        ) : null}
        {d.analysis?.hr_zones ? (
          <ZoneCard
            title="Time in heart-rate zones"
            zones={d.analysis.hr_zones}
            unit="bpm"
            threshold={`Threshold ${num(d.analysis.threshold_hr)} bpm`}
          />
        ) : null}
        {d.analysis && d.analysis.power_curve.length ? <RideCurve detail={d} /> : null}
        {streams.data?.lat && streams.data.lng ? (
          <section className="card" aria-label="Route">
            <div className="card-head">
              <div>
                <h2>Route</h2>
                <p>GPS track, north up</p>
              </div>
            </div>
            <RouteMap lat={streams.data.lat} lng={streams.data.lng} />
          </section>
        ) : null}
      </div>
      {d.laps.length > 1 ? <LapsTable laps={d.laps} running={d.activity.sport === "running"} /> : null}
    </>
  );
}

function Header({ detail }: { detail: ActivityDetail }) {
  const a = detail.activity;
  const recordedWith = [detail.device, a.source === "strava" ? "via Strava" : `via ${a.source}`].filter(Boolean).join(" ");
  return (
    <div className="page-head">
      <div>
        <p className="small" style={{ margin: 0 }}>
          <Link to={`/calendar?month=${a.local_date.slice(0, 7)}`}>← {formatFullDay(a.local_date)}</Link>
        </p>
        <h1 style={{ marginTop: 4 }}>{a.name ?? "Untitled workout"}</h1>
        <p>
          <span className="badge">{sportLabel(a.sport)}</span> {recordedWith}
        </p>
      </div>
    </div>
  );
}

function Tiles({ detail }: { detail: ActivityDetail }) {
  const a = detail.activity;
  const m = detail.analysis;
  const byHr = m?.tss_method === "hr";
  const tssHint = byHr ? "from heart rate" : m?.tss_method === "power" ? "from power" : undefined;
  const ifHint = byHr
    ? m?.threshold_hr
      ? `Threshold ${num(m.threshold_hr)} bpm`
      : undefined
    : m?.ftp_w
      ? `FTP ${num(m.ftp_w)} W`
      : undefined;
  const hasPower = isNum(m?.normalized_power_w) || isNum(m?.avg_power_w);
  return (
    <div className="tiles">
      <StatTile label="Moving time" value={duration(a.moving_s ?? m?.timer_s)} hint={`Elapsed ${duration(a.duration_s)}`} />
      <StatTile label="Distance" value={isNum(a.distance_m) ? num(a.distance_m / 1000, 1) : "—"} unit="km" />
      <StatTile label="Elevation" value={num(a.elevation_gain_m)} unit="m" />
      <StatTile label="TSS" value={num(m?.tss)} hint={tssHint} />
      <StatTile label="Intensity (IF)" value={num(m?.intensity_factor, 2)} hint={ifHint} />
      {hasPower ? (
        <>
          <StatTile label="Normalized power" value={num(m?.normalized_power_w)} unit="W" hint={isNum(m?.avg_power_w) ? `Avg ${num(m?.avg_power_w)} W` : undefined} />
          <StatTile label="Variability (VI)" value={num(m?.variability_index, 2)} />
          <StatTile label="Efficiency (EF)" value={num(m?.efficiency_factor, 2)} hint="NP ÷ avg HR" />
          <StatTile label="Decoupling (Pw:HR)" value={pct(m?.decoupling_pct)} hint="2nd half vs 1st" />
          <StatTile label="Work" value={num(m?.work_kj)} unit="kJ" hint={isNum(a.calories) ? `${num(a.calories)} kcal` : undefined} />
        </>
      ) : null}
      <StatTile label="Heart rate" value={num(m?.avg_hr ?? a.avg_hr)} unit="bpm" hint={`Max ${num(a.max_hr ?? m?.max_hr)} bpm`} />
    </div>
  );
}

function elapsedLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, "0")}` : `${m}m`;
}

function StreamCharts({ streams, running }: { streams: Streams; running: boolean }) {
  const c = useColors();
  const [hover, setHover] = useState<number | null>(null);
  // FIT files record running cadence per leg (strides/min); watches show steps/min, twice that.
  const specs = useMemo(
    () => CHANNELS.map((ch) => (ch.key === "cadence" && running ? { ...ch, unit: "spm", scale: 2 } : ch)),
    [running],
  );
  const channels = specs.filter((ch) => streams[ch.key]?.some((v) => v !== null));
  const rows = useMemo(
    () =>
      streams.time.map((t, i) => {
        const row: Record<string, number | null> = { t };
        for (const ch of specs) {
          const v = streams[ch.key]?.[i];
          row[ch.key] = v === null || v === undefined ? null : v * (ch.scale ?? 1);
        }
        return row;
      }),
    [streams, specs],
  );
  const at = hover !== null ? rows[hover] : undefined;
  const onMove = (state: { activeTooltipIndex?: number | string | null }) => {
    const i = Number(state?.activeTooltipIndex);
    setHover(Number.isInteger(i) ? i : null);
  };

  return (
    <section className="card" aria-label="Workout charts">
      <div className="card-head">
        <div>
          <h2>Workout</h2>
          <p>Hover a chart to read every channel at that moment</p>
        </div>
      </div>
      <div className="readout" aria-live="off">
        <span>
          <span className="muted">Time </span>
          <strong>{at ? duration(at.t) : "—"}</strong>
        </span>
        {channels.map((ch) => (
          <span key={ch.key}>
            <i className="key-line" style={{ background: c[ch.token] }} aria-hidden />
            <span className="muted">{ch.label} </span>
            <strong>{at ? withUnit(at[ch.key], ch.unit, ch.digits) : "—"}</strong>
          </span>
        ))}
      </div>
      {channels.map((ch, i) => (
        <div key={ch.key} className="stream-chart">
          <div className="stream-label">
            {ch.label} <span className="muted">({ch.unit})</span>
          </div>
          <ResponsiveContainer width="100%" height={ch.key === "altitude" ? 110 : 130}>
            <ComposedChart
              data={rows}
              syncId="workout"
              margin={{ top: 4, right: 12, bottom: 0, left: -8 }}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            >
              <CartesianGrid {...gridProps(c)} />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                {...axisProps(c)}
                tickFormatter={elapsedLabel}
                hide={i < channels.length - 1}
              />
              <YAxis {...axisProps(c)} width={44} domain={ch.key === "altitude" ? ["auto", "auto"] : [0, "auto"]} />
              <Tooltip cursor={{ stroke: c["text-muted"], strokeWidth: 1 }} content={() => null} />
              {ch.key === "altitude" ? (
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
      ))}
    </section>
  );
}

function ZoneCard({ title, zones, unit, threshold }: { title: string; zones: Zone[]; unit: string; threshold: string }) {
  const c = useColors();
  const total = zones.reduce((t, z) => t + z.seconds, 0) || 1;
  const data = zones.map((z, i) => {
    const lower = i === 0 ? 0 : (zones[i - 1]!.upper ?? 0) + 1;
    const range = z.upper === null ? `${lower}+ ${unit}` : `${lower}–${z.upper} ${unit}`;
    return { ...z, range, share: (z.seconds / total) * 100 };
  });
  return (
    <ChartCard
      title={title}
      subtitle={threshold}
      table={() => (
        <table className="data">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Range</th>
              <th>Time</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((z) => (
              <tr key={z.zone}>
                <td>{z.zone}</td>
                <td>{z.range}</td>
                <td>{duration(z.seconds)}</td>
                <td>{pct(z.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    >
      <ResponsiveContainer width="100%" height={zones.length * 30 + 10}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="zone" {...axisProps(c)} axisLine={false} width={150} tick={{ fill: c["text-secondary"], fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.35 }}
            content={({ active, payload }) => {
              const z = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !z) return null;
              return (
                <TooltipBox
                  title={`${z.zone} · ${z.range}`}
                  rows={[
                    { name: "Time", value: duration(z.seconds), color: c["series-1"] },
                    { name: "Share", value: pct(z.share) },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="seconds"
            fill={c["series-1"]}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
            label={{
              position: "right",
              fill: c["text-secondary"],
              fontSize: 11,
              formatter: (v: unknown) => (typeof v === "number" && v > 0 ? duration(v) : ""),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function RideCurve({ detail }: { detail: ActivityDetail }) {
  const c = useColors();
  const day = detail.activity.local_date;
  const best = usePowerCurve({ start_date: addDays(day, -89), end_date: day }, true, false);
  const ride = detail.analysis!.power_curve;
  const bestBy = new Map((best.data ?? []).map((p) => [p.duration_s, p.watts]));
  const data = ride.map((p: CurvePoint) => ({ d: p.duration_s, ride: p.watts, best: bestBy.get(p.duration_s) ?? null }));
  return (
    <ChartCard
      title="Peak power"
      subtitle="This ride's best power per duration vs your best of the 90 days up to it"
      legend={[
        { label: "This ride", color: c["series-1"] },
        { label: "90-day best", color: c["series-2"] },
      ]}
      table={() => (
        <table className="data">
          <thead>
            <tr>
              <th>Duration</th>
              <th>This ride</th>
              <th>90-day best</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.d}>
                <td>{durationLabel(p.d)}</td>
                <td>{num(p.ride)} W</td>
                <td>{isNum(p.best) ? `${num(p.best)} W` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis
            dataKey="d"
            type="number"
            scale="log"
            domain={["dataMin", "dataMax"]}
            ticks={[1, 5, 15, 60, 300, 1200, 3600, 10800].filter((t) => t <= (data[data.length - 1]?.d ?? 0))}
            tickFormatter={durationLabel}
            {...axisProps(c)}
          />
          <YAxis {...axisProps(c)} width={44} />
          <Tooltip
            cursor={{ stroke: c.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !p) return null;
              return (
                <TooltipBox
                  title={`Best ${durationLabel(p.d)}`}
                  rows={[
                    { name: "This ride", value: `${num(p.ride)} W`, color: c["series-1"] },
                    { name: "90-day best", value: isNum(p.best) ? `${num(p.best)} W` : "—", color: c["series-2"] },
                  ]}
                />
              );
            }}
          />
          <Line dataKey="best" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="ride" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function LapsTable({ laps, running }: { laps: Lap[]; running: boolean }) {
  const hasPower = laps.some((lap) => isNum(lap.avg_power));
  const hasCadence = laps.some((lap) => isNum(lap.avg_cadence));
  return (
    <section className="card" aria-label="Laps">
      <div className="card-head">
        <h2>Laps</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Lap</th>
              <th>Time</th>
              <th>Distance</th>
              {hasPower ? (
                <>
                  <th>Avg power</th>
                  <th>NP</th>
                  <th>Max power</th>
                </>
              ) : null}
              <th>Avg HR</th>
              {hasCadence ? <th>Cadence</th> : null}
              <th>Ascent</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{duration(lap.total_timer_time ?? lap.total_elapsed_time)}</td>
                <td>{km(lap.total_distance, 2)}</td>
                {hasPower ? (
                  <>
                    <td>{withUnit(lap.avg_power, "W")}</td>
                    <td>{withUnit(lap.normalized_power, "W")}</td>
                    <td>{withUnit(lap.max_power, "W")}</td>
                  </>
                ) : null}
                <td>{num(lap.avg_heart_rate)}</td>
                {hasCadence ? <td>{num(isNum(lap.avg_cadence) && running ? lap.avg_cadence * 2 : lap.avg_cadence)}</td> : null}
                <td>{withUnit(lap.total_ascent, "m")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
