import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Performance, PerformanceDay } from "@/api";
import { axisProps, Card, CardHeader, gridProps, lineCursor, tooltipContent, TooltipBox } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import type { Token } from "@/lib/theme";

import { change, componentSeries, daysSinceTested, STALE_DAYS, weightShares } from "../lib/performance";
import type { DateTick } from "../lib/types";

type Point = { date: string; value: number | null };

/** One small chart per component (each an index, 100 = baseline), with its weight and when it was last tested;
 *  aerobic efficiency alongside (not in the score). */
export function PerformanceComponentsCard({ perf, days, tick }: { perf: Performance; days: PerformanceDay[]; tick: DateTick }) {
  const latest = days[days.length - 1]!;
  const shares = weightShares(perf.weights);
  return (
    <Card label="Performance components">
      <CardHeader
        title="What the score is made of"
        subtitle="Each component as an index (100 = your baseline) of W/kg, each ride's power over its own weight (durability: the share of power kept), its weight in the score, and when you last went near-maximal for it."
      />
      <div className="mini-grid">
        {perf.components.map((k) => {
          const series = componentSeries(days, k.key);
          const since = daysSinceTested(latest.components[k.key].tested, latest.date);
          const stale = since === null || since > STALE_DAYS;
          return (
            <MiniChart
              key={k.key}
              title={k.label}
              note={`${k.description} · ${num(shares[k.key])} % of the score`}
              value={num(latest.components[k.key].index, 1)}
              delta={change(series.map((p) => p.value)).delta}
              status={
                since === null ? "Not tested in the window" : since === 0 ? "Tested today" : `Last tested ${since} day${since === 1 ? "" : "s"} ago`
              }
              stale={stale}
              flag={latest.components[k.key].estimated_weight ? "Rests on an estimated weight (a long gap without weigh-ins)" : undefined}
              data={series}
              baseline
              token="series-1"
              digits={1}
              tick={tick}
            />
          );
        })}
        <MiniChart
          title="Aerobic efficiency"
          note="Median NP ÷ HR of steady rides of an hour or more (42 days) · not in the score"
          value={num(latest.efficiency, 2)}
          delta={change(days.map((d) => d.efficiency)).delta}
          deltaDigits={2}
          data={days.map((d) => ({ date: d.date, value: d.efficiency }))}
          token="series-3"
          digits={2}
          tick={tick}
        />
      </div>
    </Card>
  );
}

function MiniChart({
  title,
  note,
  value,
  delta,
  deltaDigits = 1,
  status,
  stale = false,
  flag,
  data,
  baseline = false,
  token,
  digits,
  tick,
}: {
  title: string;
  note: string;
  value: string;
  delta: number | null;
  deltaDigits?: number;
  status?: string;
  stale?: boolean;
  /** A caveat on the value (e.g. it rests on an estimated weight). */
  flag?: string;
  data: Point[];
  baseline?: boolean;
  token: Token;
  digits: number;
  tick: DateTick;
}) {
  const c = useColors();
  return (
    <section className="mini" aria-label={title}>
      <div className="mini-head">
        <strong>{title}</strong>
        <span className="mini-value">
          {value} <span className="muted small">({signed(delta, deltaDigits)} in range)</span>
        </span>
      </div>
      <div className="small muted">{note}</div>
      {status ? <div className={stale ? "small mini-stale" : "small muted"}>{stale ? `⚠ ${status}` : status}</div> : null}
      {flag ? <div className="small mini-stale">⚠ {flag}</div> : null}
      <ResponsiveContainer width="100%" height={110}>
        <ComposedChart data={data} syncId="perf" syncMethod="value" margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid {...gridProps(c)} />
          <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={50} />
          <YAxis
            {...axisProps(c)}
            width={44}
            domain={["auto", "auto"]}
            tickCount={3}
            tickFormatter={(v: number) => num(v, digits > 1 ? 2 : 0)}
          />
          {baseline ? <ReferenceLine y={100} stroke={c.axis} strokeDasharray="4 3" /> : null}
          <Tooltip
            cursor={lineCursor(c)}
            content={tooltipContent<Point>((p) => (
              <TooltipBox title={formatFullDay(p.date)} rows={[{ name: title, value: num(p.value, digits), color: c[token] }]} />
            ))}
          />
          <Line dataKey="value" stroke={c[token]} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
