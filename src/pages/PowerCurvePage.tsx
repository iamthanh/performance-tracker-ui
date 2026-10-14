import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { usePowerCurve, useThresholds } from "../api/hooks";
import type { BestPower } from "../api/types";
import { ChartCard, Empty, ErrorState, Loading, StatTile, TooltipBox } from "../components/ui";
import { RANGE_PRESETS, formatFullDay, presetRange, today } from "../lib/dates";
import { durationLabel, isNum, num } from "../lib/format";
import { axisProps, gridProps, useColors } from "../lib/theme";

const COMPARE = RANGE_PRESETS.filter((p) => p.id !== "42d");
const KEY_DURATIONS = [5, 60, 300, 1200, 3600];
const TICKS = [1, 5, 15, 60, 300, 1200, 3600, 10800, 18000];

function RangeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {COMPARE.map((p) => (
          <option key={p.id} value={p.id}>
            {p.all ? "All time" : `Last ${p.label}`}
          </option>
        ))}
        <option value="none">None</option>
      </select>
    </label>
  );
}

export function PowerCurvePage() {
  const [a, setA] = useState("90d");
  const [b, setB] = useState("all");
  const rangeA = presetRange(COMPARE.find((p) => p.id === a) ?? COMPARE[0]!);
  const presetB = COMPARE.find((p) => p.id === b);
  const rangeB = presetB ? presetRange(presetB) : null;
  const curveA = usePowerCurve({ start_date: rangeA.start, end_date: rangeA.end });
  const curveB = usePowerCurve({ start_date: rangeB?.start, end_date: rangeB?.end }, !!rangeB);
  const ftp = useThresholds(today());
  const c = useColors();

  const labelA = COMPARE.find((p) => p.id === a)?.all ? "All time" : `Last ${COMPARE.find((p) => p.id === a)?.label}`;
  const labelB = presetB ? (presetB.all ? "All time" : `Last ${presetB.label}`) : "";

  const rows = useMemo(() => {
    const byA = new Map((curveA.data ?? []).map((p) => [p.duration_s, p]));
    const byB = new Map((curveB.data ?? []).map((p) => [p.duration_s, p]));
    const durations = [...new Set([...byA.keys(), ...(rangeB ? byB.keys() : [])])].sort((x, y) => x - y);
    return durations.map((d) => ({ d, a: byA.get(d) ?? null, b: rangeB ? (byB.get(d) ?? null) : null }));
  }, [curveA.data, curveB.data, rangeB]);
  const chart = rows.map((r) => ({ d: r.d, a: r.a?.watts ?? null, b: r.b?.watts ?? null }));
  const currentFtp = ftp.data?.in_effect?.ftp_w ?? null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Power curve</h1>
          <p>Your best average power for every duration (mean-maximal power), rides only. Tiles show the first range.</p>
        </div>
        <div className="filters">
          <RangeSelect label="Compare" value={a} onChange={setA} />
          <RangeSelect label="Against" value={b} onChange={setB} />
        </div>
      </div>

      {curveA.isError ? (
        <div className="card">
          <ErrorState error={curveA.error} />
        </div>
      ) : curveA.isPending ? (
        <div className="card">
          <Loading />
        </div>
      ) : !rows.length ? (
        <div className="card">
          <Empty title="No power data in this range" />
        </div>
      ) : (
        <>
          <div className="tiles">
            {KEY_DURATIONS.map((d) => {
              const row = rows.find((r) => r.d === d);
              const best = row?.a?.watts;
              const other = row?.b?.watts;
              return (
                <StatTile
                  key={d}
                  label={`Best ${durationLabel(d)}`}
                  value={num(best)}
                  unit="W"
                  hint={isNum(other) ? `${labelB}: ${num(other)} W` : undefined}
                />
              );
            })}
            <StatTile label="FTP in effect" value={num(currentFtp)} unit="W" hint="95% of best 20 min, or your setting" />
          </div>

          <ChartCard
            title="Mean-maximal power"
            subtitle="Log time axis: sprints on the left, endurance on the right"
            refetching={curveA.isFetching || curveB.isFetching}
            legend={[
              { label: labelA, color: c["series-1"] },
              ...(rangeB ? [{ label: labelB, color: c["series-2"] }] : []),
            ]}
            table={() => <CurveTable rows={rows} labelA={labelA} labelB={labelB} />}
          >
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 0, left: -4 }}>
                <CartesianGrid {...gridProps(c)} />
                <XAxis
                  dataKey="d"
                  type="number"
                  scale="log"
                  domain={["dataMin", "dataMax"]}
                  ticks={TICKS.filter((t) => t <= (chart[chart.length - 1]?.d ?? 0))}
                  tickFormatter={durationLabel}
                  {...axisProps(c)}
                />
                <YAxis {...axisProps(c)} width={48} unit=" W" />
                <Tooltip
                  cursor={{ stroke: c.axis, strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as (typeof chart)[number] | undefined;
                    if (!active || !p) return null;
                    const row = rows.find((r) => r.d === p.d);
                    return (
                      <TooltipBox
                        title={`Best ${durationLabel(p.d)}`}
                        rows={[
                          {
                            name: `${labelA}${row?.a ? ` (${formatFullDay(row.a.local_date)})` : ""}`,
                            value: isNum(p.a) ? `${num(p.a)} W` : "—",
                            color: c["series-1"],
                          },
                          ...(rangeB
                            ? [
                                {
                                  name: `${labelB}${row?.b ? ` (${formatFullDay(row.b.local_date)})` : ""}`,
                                  value: isNum(p.b) ? `${num(p.b)} W` : "—",
                                  color: c["series-2"],
                                },
                              ]
                            : []),
                        ]}
                      />
                    );
                  }}
                />
                {rangeB ? <Line dataKey="b" stroke={c["series-2"]} strokeWidth={2} dot={false} isAnimationActive={false} /> : null}
                <Line dataKey="a" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </>
  );
}

function SetBy({ p }: { p: BestPower | null }) {
  if (!p) return <span className="muted">—</span>;
  return (
    <Link to={`/activities/${encodeURIComponent(p.source)}/${encodeURIComponent(p.source_id)}`}>
      {formatFullDay(p.local_date)}
    </Link>
  );
}

function CurveTable({
  rows,
  labelA,
  labelB,
}: {
  rows: { d: number; a: BestPower | null; b: BestPower | null }[];
  labelA: string;
  labelB: string;
}) {
  return (
    <table className="data">
      <thead>
        <tr>
          <th>Duration</th>
          <th>{labelA}</th>
          <th>Set on</th>
          {labelB ? (
            <>
              <th>{labelB}</th>
              <th>Set on</th>
            </>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.d}>
            <td>{durationLabel(r.d)}</td>
            <td>{r.a ? `${num(r.a.watts)} W` : "—"}</td>
            <td>
              <SetBy p={r.a} />
            </td>
            {labelB ? (
              <>
                <td>{r.b ? `${num(r.b.watts)} W` : "—"}</td>
                <td>
                  <SetBy p={r.b} />
                </td>
              </>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
