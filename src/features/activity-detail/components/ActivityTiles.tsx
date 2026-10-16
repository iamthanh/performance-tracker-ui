import type { ActivityDetail } from "@/api";
import { StatTile } from "@/components";
import { duration, isNum, num, pct } from "@/lib/format";

/** The workout's headline numbers; power tiles only when it has power. */
export function ActivityTiles({ detail }: { detail: ActivityDetail }) {
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
