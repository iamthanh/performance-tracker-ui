import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

import type { RideCardio } from "@/api";
import { axisProps, CHART_MARGIN, ChartCard, DataTable, gridProps, StatTile, tooltipContent, TooltipBox, Y_AXIS_WIDTH } from "@/components";
import { useColors } from "@/hooks";
import { bpmAsWatts, correctionParts } from "@/lib/cardio";
import { elapsedLabel, num, signed } from "@/lib/format";

type Block = RideCardio["blocks"][number];

/** Why a steady block is left out of the ride's value (`outlier`: the whole ride is). */
function leftOut(b: Block, band: [number, number], outlier: boolean): string | null {
  if (outlier) return "the ride is left out (far from your other rides)";
  if (b.used) return null;
  if (b.warm_up) return "in the first 20 min (warming up)";
  if (b.watts < band[0] || b.watts > band[1]) return "too far from the reference power";
  return "only one block near the reference power (needs 2)";
}

/** The ride's steady riding as heart rate against power, against your recent normal at the same conditions: how
 *  many beats the reference power took today. */
export function HeartRatePowerCard({ data }: { data: RideCardio }) {
  const c = useColors();
  const { model, ride, normal } = data;
  if (!model) return null;
  const ref = model.reference;
  const band: [number, number] = [ref.power_w * 0.65, ref.power_w * 1.35];
  const outlier = !!ride?.outlier;
  const used = data.blocks.filter((b) => b.used && !outlier);
  const other = data.blocks.filter((b) => !b.used || outlier);
  const watts = data.blocks.map((b) => b.watts);
  const lo = Math.min(band[0], ...watts);
  const hi = Math.max(band[1], ...watts);
  // A line through `bpm` at the reference power along the slope, across the chart.
  const line = (bpm: number): [{ x: number; y: number }, { x: number; y: number }] => [
    { x: lo, y: bpm + model.slope_bpm_per_w * (lo - ref.power_w) },
    { x: hi, y: bpm + model.slope_bpm_per_w * (hi - ref.power_w) },
  ];
  const conditions = ride ? correctionParts(ride) : [];
  const diff = normal?.difference_bpm ?? null;
  const counted = data.recoveries.filter((r) => r.counts);
  return (
    <ChartCard
      title="Heart rate against power"
      subtitle={`Each dot is 5 minutes of steady riding. The ride's heart rate at ${num(ref.power_w)} W (the median of its blocks, moved along your slope of ${num(model.slope_bpm_per_w, 2)} bpm per W) against the median of your other rides in the last 42 days, both corrected to outdoors, ${model.corrections.heat_from_c} °C or cooler and fresh. Fewer beats is fitter.`}
      legend={[
        { label: "Steady block (counted)", color: c["series-1"], shape: "dot" },
        { label: "Steady block (left out)", color: c["text-muted"], shape: "dot" },
        { label: "This ride", color: c["series-1"] },
        { label: "Your normal, at this ride's conditions", color: c["series-2"] },
      ]}
      table={() => <BlockTable blocks={data.blocks} band={band} outlier={outlier} />}
    >
      <div className="tiles" style={{ marginBottom: 12 }}>
        <StatTile
          hero
          label={`This ride at ${num(ref.power_w)} W`}
          value={num(ride?.bpm, 1)}
          unit="bpm"
          hint={
            ride?.outlier
              ? `${num(ride.raw_bpm, 1)} as ridden: far from your other rides, likely a heart-rate sensor problem (left out)`
              : ride?.bpm != null
                ? `${num(ride.raw_bpm, 1)} as ridden${conditions.length ? `; ${conditions.join(", ")}` : ""}`
                : "not enough steady riding near the reference power"
          }
        />
        <StatTile label="Your 42-day normal" value={num(normal?.bpm, 1)} unit="bpm" hint={normal ? `median of ${normal.rides} other rides` : "needs 5 other rides"} />
        <StatTile
          label="Difference"
          value={signed(diff, 1)}
          unit="bpm"
          hint={
            diff === null
              ? undefined
              : Math.abs(diff) < 0.5
                ? "as usual"
                : `${diff < 0 ? "fitter" : "harder"} than usual (≈ ${signed(bpmAsWatts(diff, model), 0)} W at ${num(ref.hr_bpm)} bpm)`
          }
        />
        <StatTile
          label="HR recovery"
          value={num(ride?.recovery_bpm, 1)}
          unit="bpm"
          hint={counted.length ? `drop in the minute after ${counted.length} hard effort${counted.length === 1 ? "" : "s"} (corrected)` : "no hard effort with an easy minute after"}
        />
      </div>
      {data.blocks.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={CHART_MARGIN}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="watts" type="number" name="Power" unit=" W" domain={[Math.floor(lo / 10) * 10, Math.ceil(hi / 10) * 10]} {...axisProps(c)} />
            <YAxis dataKey="bpm" type="number" name="Heart rate" width={Y_AXIS_WIDTH} domain={["auto", "auto"]} {...axisProps(c)} />
            <ReferenceLine x={ref.power_w} stroke={c.axis} strokeDasharray="4 3" />
            {normal ? <ReferenceLine segment={line(normal.bpm_at_conditions)} stroke={c["series-2"]} strokeWidth={2} ifOverflow="hidden" /> : null}
            {ride?.raw_bpm != null ? <ReferenceLine segment={line(ride.raw_bpm)} stroke={c["series-1"]} strokeWidth={2} ifOverflow="hidden" /> : null}
            <Tooltip
              cursor={false}
              content={tooltipContent<Block>((b) => (
                <TooltipBox
                  title={`From ${elapsedLabel(b.start_s)} riding`}
                  rows={[
                    { name: "Power", value: `${num(b.watts)} W` },
                    { name: "Heart rate", value: `${num(b.bpm, 1)} bpm`, color: b.used ? c["series-1"] : c["text-muted"] },
                    { name: "Work before", value: `${num(b.kj_before)} kJ` },
                    ...(b.temp_c !== null ? [{ name: "Temperature", value: `${num(b.temp_c, 1)} °C` }] : []),
                    ...(leftOut(b, band, outlier) ? [{ name: "Left out", value: leftOut(b, band, outlier)! }] : []),
                  ]}
                />
              ))}
            />
            <Scatter data={other} fill={c["text-muted"]} isAnimationActive={false} />
            <Scatter data={used} fill={c["series-1"]} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <p className="small muted">No steady riding in this ride: 5 minutes of even power after 3 minutes at it.</p>
      )}
      {data.recoveries.length ? (
        <p className="small muted" style={{ marginBottom: 0 }}>
          HR recoveries: {data.recoveries.map((r) => `${num(r.drop_bpm)} bpm from ${num(r.peak_bpm)}${r.counts ? "" : " (not counted)"}`).join(" · ")}.
          Counted when the effort was near threshold and you then eased right off (riding on keeps heart rate up).
        </p>
      ) : null}
    </ChartCard>
  );
}

/** Table twin: every steady block, in ride order. */
function BlockTable({ blocks, band, outlier }: { blocks: Block[]; band: [number, number]; outlier: boolean }) {
  return (
    <DataTable
      rows={blocks}
      rowKey={(b) => String(b.start_s)}
      columns={[
        { key: "start", header: "From", cell: (b) => elapsedLabel(b.start_s), headerClassName: "left", cellClassName: "left" },
        { key: "watts", header: "Power (W)", cell: (b) => num(b.watts) },
        { key: "bpm", header: "Heart rate", cell: (b) => num(b.bpm, 1) },
        { key: "kj", header: "Work before (kJ)", cell: (b) => num(b.kj_before) },
        { key: "temp", header: "°C", cell: (b) => num(b.temp_c, 1) },
        { key: "used", header: "Counted", cell: (b) => leftOut(b, band, outlier) ?? "yes", headerClassName: "left", cellClassName: "left secondary" },
      ]}
    />
  );
}
