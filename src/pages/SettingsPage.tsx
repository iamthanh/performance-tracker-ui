import { useMemo, useState, type FormEvent } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useThresholdMutations, useThresholds } from "../api/hooks";
import type { ThresholdMetric } from "../api/types";
import { ChartCard, Empty, ErrorState, Loading, StatTile, TooltipBox } from "../components/ui";
import { formatFullDay, formatShortMonth, parseISO, toISO, today } from "../lib/dates";
import { num } from "../lib/format";
import { axisProps, gridProps, useColors } from "../lib/theme";
import { thresholdHistory } from "../lib/training";

const METRICS: { value: ThresholdMetric; label: string; short: string; unit: string; help: string }[] = [
  { value: "ftp_w", label: "FTP", short: "FTP", unit: "W", help: "Auto: 95% of your best 20-minute ride power in the trailing year" },
  { value: "threshold_hr", label: "Threshold heart rate", short: "Threshold HR", unit: "bpm", help: "Auto: your best 20-minute ride heart rate in the trailing year" },
  { value: "max_hr", label: "Max heart rate", short: "Max HR", unit: "bpm", help: "Auto: third-highest best-30-second heart rate in the trailing year" },
  { value: "resting_hr", label: "Resting heart rate", short: "Resting HR", unit: "bpm", help: "No auto value; 50 bpm is assumed until you set one" },
];

const meta = (m: ThresholdMetric) => METRICS.find((x) => x.value === m)!;

export function SettingsPage() {
  const thresholds = useThresholds(today());
  const { set, remove } = useThresholdMutations();
  const c = useColors();
  const [metric, setMetric] = useState<ThresholdMetric>("ftp_w");
  const [date, setDate] = useState(today());
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const values = thresholds.data?.values ?? [];
  const ftpHistory = useMemo(
    () => thresholdHistory(values.filter((v) => v.metric === "ftp_w"), today()).map((p) => ({ ...p, t: parseISO(p.date).getTime() })),
    [values],
  );
  // One tick per year (Jan 1) across the history's span.
  const yearTicks = useMemo(() => {
    if (!ftpHistory.length) return [];
    const first = Number(ftpHistory[0]!.date.slice(0, 4)) + 1;
    const last = Number(ftpHistory[ftpHistory.length - 1]!.date.slice(0, 4));
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => Date.UTC(first + i, 0, 1));
  }, [ftpHistory]);
  const timeTick = (t: number) => (yearTicks.length ? toISO(new Date(t)).slice(0, 4) : formatShortMonth(toISO(new Date(t))));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    set.mutate(
      { metric, effective_date: date, value: Number(value), note: note || undefined },
      {
        onSuccess: (r) => {
          setMessage(`Saved. ${r.analysis.rescored} workouts re-scored.`);
          setValue("");
          setNote("");
        },
      },
    );
  };

  if (thresholds.isError) {
    return (
      <div className="card">
        <ErrorState error={thresholds.error} />
      </div>
    );
  }
  if (thresholds.isPending) {
    return (
      <div className="card">
        <Loading />
      </div>
    );
  }
  const now = thresholds.data.in_effect;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Thresholds behind TSS, intensity and zones. Automatic values follow your best efforts; your own values override them from their date on.</p>
        </div>
      </div>

      <div className="tiles">
        {METRICS.map((m) => (
          <StatTile key={m.value} label={m.short} value={num(now?.[m.value])} unit={m.unit} hint={m.value === "resting_hr" && !now?.resting_hr ? "50 assumed" : undefined} />
        ))}
      </div>

      <section className="card" aria-label="Set a threshold">
        <div className="card-head">
          <div>
            <h2>Set a threshold</h2>
            <p>
              A value you set holds until your next one, unless a new best effort pushes the automatic value above it. Every
              workout from that date on is re-scored.
            </p>
          </div>
        </div>
        <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit}>
          <label className="field">
            Threshold
            <select value={metric} onChange={(e) => setMetric(e.target.value as ThresholdMetric)}>
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            From
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            Value ({meta(metric).unit})
            <input type="number" required min={1} step="any" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 110 }} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>
            Note
            <input type="text" placeholder="e.g. ramp test" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button className="btn primary" type="submit" disabled={set.isPending}>
            {set.isPending ? "Saving…" : "Save"}
          </button>
        </form>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {meta(metric).help}
        </p>
        {set.isError || remove.isError ? (
          <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
            {((set.error ?? remove.error) as Error).message}
          </p>
        ) : null}
        {message ? <p className="small" style={{ color: "var(--success-text)" }}>{message}</p> : null}
      </section>

      <ChartCard title="FTP over time" subtitle="The value in effect on each date (automatic and your own)">
        {ftpHistory.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ftpHistory} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid {...gridProps(c)} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={yearTicks.length ? yearTicks : undefined}
                {...axisProps(c)}
                tickFormatter={timeTick}
              />
              <YAxis {...axisProps(c)} width={48} unit=" W" domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: c.axis, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof ftpHistory)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <TooltipBox
                      title={`From ${formatFullDay(p.date)}`}
                      rows={[
                        { name: p.origin === "manual" ? "Your FTP" : "Auto FTP", value: `${num(p.value)} W`, color: c["series-1"] },
                      ]}
                    />
                  );
                }}
              />
              <Line type="stepAfter" dataKey="value" stroke={c["series-1"]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty title="No FTP yet">Import rides with power, or set your FTP above.</Empty>
        )}
      </ChartCard>

      <section className="card" aria-label="All threshold values" style={{ padding: 0 }}>
        <div className="card-head" style={{ padding: "16px 16px 0" }}>
          <h2>All values</h2>
        </div>
        <div className="table-wrap" style={{ maxHeight: 480 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Threshold</th>
                <th>From</th>
                <th>Value</th>
                <th className="left">Origin</th>
                <th className="left">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...values].sort((a, b) => b.effective_date.localeCompare(a.effective_date)).map((v) => (
                <tr key={`${v.metric}/${v.effective_date}/${v.origin}`}>
                  <td>{meta(v.metric).label}</td>
                  <td>{formatFullDay(v.effective_date)}</td>
                  <td>
                    {num(v.value, Number.isInteger(v.value) ? 0 : 1)} {meta(v.metric).unit}
                  </td>
                  <td className="left">{v.origin === "manual" ? <span className="badge">yours</span> : <span className="muted">auto</span>}</td>
                  <td className="left secondary">{v.note}</td>
                  <td>
                    {v.origin === "manual" ? (
                      <button
                        type="button"
                        className="btn ghost small"
                        disabled={remove.isPending}
                        onClick={() => {
                          const what = `${meta(v.metric).label} ${num(v.value, Number.isInteger(v.value) ? 0 : 1)} ${meta(v.metric).unit} from ${formatFullDay(v.effective_date)}`;
                          if (window.confirm(`Remove your ${what}? Workouts from that date will be re-scored.`)) {
                            setMessage(null);
                            remove.mutate(
                              { metric: v.metric, effectiveDate: v.effective_date },
                              { onSuccess: (r) => setMessage(`Removed. ${r.analysis.rescored} workouts re-scored.`) },
                            );
                          }
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
