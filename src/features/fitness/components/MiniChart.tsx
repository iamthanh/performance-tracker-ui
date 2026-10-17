import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisProps, gridProps, lineCursor, tooltipContent, TooltipBox } from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import type { Token } from "@/lib/theme";

import type { DateTick } from "../lib/types";

type Point = { date: string; value: number | null };

/** A small chart of one component over the range, with its latest value, the change in the range and notes. */
export function MiniChart({
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
  syncId,
  empty,
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
  /** Charts with the same id share a hover cursor. */
  syncId: string;
  /** Shown instead of the chart when there is nothing to plot. */
  empty?: string;
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
      {empty ? (
        <p className="small muted mini-empty">{empty}</p>
      ) : (
        <ResponsiveContainer width="100%" height={110}>
          <ComposedChart data={data} syncId={syncId} syncMethod="value" margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
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
      )}
    </section>
  );
}
