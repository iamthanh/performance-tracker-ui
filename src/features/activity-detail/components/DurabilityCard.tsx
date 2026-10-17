import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Durability, RideWeight } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, DataTable, gridProps, lineCursor, tooltipContent, TooltipBox, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { durationLabel, isNum, num, pct } from "@/lib/format";
import type { Token } from "@/lib/theme";

import { durabilityChart, durabilityRows, stepLabel, stepTicks, stepText, worstFade, wPerKg, type DurabilityRow } from "../lib/insights";

// Fixed identity per duration, in the categorical order.
const LINE_TOKENS: Token[] = ["series-1", "series-2", "series-3"];

/** Best 1, 5 and 20 minutes after the ride had done 10, 20 ... kJ/kg of work, as a share of the same efforts
 *  from the start: how well the rider resists fatigue (durability). */
export function DurabilityCard({ durability: d, weight }: { durability: Durability; weight: RideWeight | null }) {
  const c = useColors();
  const rows = durabilityRows(d);
  const data = durabilityChart(d);
  const fade = worstFade(d);
  // A fixed floor of 90 % (lower when the fade is bigger), so a 2 % fade does not fill the chart.
  const low = Math.min(90, Math.floor(Math.min(...rows.flatMap((r) => r.cells.map((x) => x.ofFresh ?? 100))) / 5) * 5);
  const spacing = 100 - low > 40 ? 10 : 5;
  const ticks = Array.from({ length: Math.floor((100 - low) / spacing) + 1 }, (_, i) => 100 - i * spacing).reverse();
  const kg = weight?.kg ?? null;
  const last = d.steps[d.steps.length - 1] ?? 0;
  const dots = d.steps.length <= 15; // many 100 kJ steps read better as plain lines
  const legend = rows.map((r, i) => ({ label: `Best ${durationLabel(r.duration_s)}`, color: c[LINE_TOKENS[i % LINE_TOKENS.length]!] }));
  const subtitle = (
    <>
      Your best efforts after the ride had already done this much work ({num(d.total)} {d.unit} in all), as a share of the same effort from the
      start. {fade ? `Biggest fade: best ${durationLabel(fade.duration_s)} at ${pct(fade.ofFresh, 0)} ${stepLabel(fade.step, d.unit, kg).replace("After", "after")}.` : ""}
      {" "}It shows what you rode: a fade means fatigue only if you went hard again late in the ride.
      {weight ? null : " Add your pre-ride weight under Fueling to see the work per kg too, as pros measure it."}
    </>
  );
  return (
    <ChartCard title="Durability" subtitle={subtitle} legend={legend} table={() => <DurabilityTable d={d} rows={rows} kg={kg} />}>
      {d.steps.length < 2 ? (
        <p className="small muted">The ride was too short to compare fresh and fatigued efforts.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis
              dataKey="step"
              type="number"
              domain={[0, last]}
              ticks={stepTicks(last)}
              tickFormatter={(s: number) => (s === 0 ? "Start" : `${stepText(s)} ${d.unit}`)}
              {...axisProps(c)}
            />
            <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} domain={[low, 100]} ticks={ticks} tickFormatter={(v: number) => `${v}%`} allowDecimals={false} />
            <ReferenceLine y={100} stroke={c.axis} />
            <Tooltip
              cursor={lineCursor(c)}
              content={tooltipContent<Record<string, number | null>>((p) => (
                <TooltipBox
                  title={stepLabel(p.step!, d.unit, kg)}
                  rows={rows.map((r, i) => ({
                    name: `Best ${durationLabel(r.duration_s)}`,
                    value: cellText(r.cells[d.steps.indexOf(p.step!)]!),
                    color: c[LINE_TOKENS[i % LINE_TOKENS.length]!],
                  }))}
                />
              ))}
            />
            {rows.map((r, i) => (
              <Line
                key={r.duration_s}
                dataKey={`d${r.duration_s}`}
                stroke={c[LINE_TOKENS[i % LINE_TOKENS.length]!]}
                strokeWidth={2}
                dot={dots ? { r: 4, strokeWidth: 2, fill: c["surface-1"] } : false}
                activeDot={{ r: 4, strokeWidth: 2, fill: c["surface-1"] }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function cellText(cell: { watts: number | null; ofFresh: number | null }): string {
  return isNum(cell.watts) ? `${num(cell.watts)} W (${pct(cell.ofFresh, 0)})` : "—";
}

/** One row per step of accumulated work, one column per effort duration. */
function DurabilityTable({ d, rows, kg }: { d: Durability; rows: DurabilityRow[]; kg: number | null }) {
  return (
    <div className="table-wrap">
      <DataTable
        rows={d.steps.map((step, i) => ({ step, i }))}
        rowKey={(r) => r.step}
        columns={[
          { key: "step", header: "Work done before", cell: (r) => stepLabel(r.step, d.unit, kg), headerClassName: "left", cellClassName: "left" },
          ...rows.map((row) => ({
            key: String(row.duration_s),
            header: `Best ${durationLabel(row.duration_s)}`,
            cell: ({ i }: { i: number }) => {
              const cell = row.cells[i]!;
              if (!isNum(cell.watts)) return "—";
              const detail = [i ? pct(cell.ofFresh, 0) : null, kg ? wPerKg(cell.watts, kg) : null].filter(Boolean).join(" · ");
              return (
                <>
                  {num(cell.watts)} W{detail ? <div className="small muted">{detail}</div> : null}
                </>
              );
            },
          })),
        ]}
      />
    </div>
  );
}
