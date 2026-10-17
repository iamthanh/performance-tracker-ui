import type { ActivityDetail, RideWeight } from "@/api";
import { StatTile } from "@/components";
import { duration, isNum, num, pct } from "@/lib/format";

import { perKg, WEIGHT_KIND_SHORT, weightNote, wPerKg } from "../lib/insights";

/** The workout's headline numbers; power tiles only when it has power, per kg with a body weight. */
export function ActivityTiles({ detail, weight }: { detail: ActivityDetail; weight: RideWeight | null }) {
  const kg = weight?.kg;
  const a = detail.activity;
  const m = detail.analysis;
  const byHr = m?.tss_method === "hr";
  const tssHint = byHr ? "from heart rate" : m?.tss_method === "power" ? "from power" : undefined;
  const ifHint = byHr
    ? m?.threshold_hr
      ? `Threshold ${num(m.threshold_hr)} bpm`
      : undefined
    : m?.ftp_w
      ? `FTP ${num(m.ftp_w)} W${kg ? ` · ${wPerKg(m.ftp_w, kg)}` : ""}`
      : undefined;
  const kjPerKg = perKg(m?.work_kj, kg);
  const workHint = [isNum(a.calories) ? `${num(a.calories)} kcal` : null, isNum(kjPerKg) ? `${num(kjPerKg, 1)} kJ/kg` : null]
    .filter(Boolean)
    .join(" · ");
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
          {kg ? (
            <StatTile
              label="Power to weight"
              value={num(perKg(m?.normalized_power_w ?? m?.avg_power_w, kg), 2)}
              unit="W/kg"
              hint={
                <span title={weightNote(weight!)}>
                  {isNum(m?.normalized_power_w) ? "NP" : "Avg"} · {num(kg, 1)} kg{" "}
                  {weight!.origin === "pre_workout" ? "(pre-ride)" : `(${WEIGHT_KIND_SHORT[weight!.kind]})`}
                </span>
              }
            />
          ) : null}
          <StatTile label="Variability (VI)" value={num(m?.variability_index, 2)} />
          <StatTile label="Efficiency (EF)" value={num(m?.efficiency_factor, 2)} hint="NP ÷ avg HR" />
          <StatTile label="Decoupling (Pw:HR)" value={pct(m?.decoupling_pct)} hint="2nd half vs 1st" />
          <StatTile label="Work" value={num(m?.work_kj)} unit="kJ" hint={workHint || undefined} />
        </>
      ) : null}
      <StatTile label="Heart rate" value={num(m?.avg_hr ?? a.avg_hr)} unit="bpm" hint={`Max ${num(a.max_hr ?? m?.max_hr)} bpm`} />
    </div>
  );
}
