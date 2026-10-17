import { useState } from "react";

import type { Effort, Efforts } from "@/api";
import { Card, CardHeader, DataTable, StatTile, type Column } from "@/components";
import { duration, num, withUnit } from "@/lib/format";

import { wPerKg } from "../lib/insights";

const SHOWN = 15;

/** Every effort above FTP, found automatically: what an interval session or a race actually contained. */
export function EffortsCard({ efforts: e, kg, wkg = "W/kg" }: { efforts: Efforts; kg: number | null; wkg?: string }) {
  const [all, setAll] = useState(false);
  const rows = all ? e.items : e.items.slice(0, SHOWN);
  const columns: Column<Effort>[] = [
    { key: "at", header: "Start", cell: (x) => duration(x.start_s), headerClassName: "left", cellClassName: "left" },
    { key: "dur", header: "Duration", cell: (x) => duration(x.duration_s) },
    { key: "avg", header: "Avg power", cell: (x) => withUnit(x.avg_power_w, "W") },
    ...(kg ? [{ key: "wkg", header: wkg, cell: (x: Effort) => wPerKg(x.avg_power_w, kg).replace(" W/kg", "") }] : []),
    { key: "ftp", header: "% FTP", cell: (x) => `${num(x.pct_ftp)}%` },
    { key: "zone", header: "Zone", cell: (x) => x.zone, headerClassName: "left", cellClassName: "left secondary" },
    { key: "max", header: "Max power", cell: (x) => withUnit(x.max_power_w, "W") },
    { key: "hr", header: "Avg / max HR", cell: (x) => (x.avg_hr ? `${num(x.avg_hr)} / ${num(x.max_hr)}` : "—") },
    { key: "cad", header: "Cadence", cell: (x) => num(x.avg_cadence) },
    { key: "kj", header: "Work", cell: (x) => withUnit(x.work_kj, "kJ", 1) },
    { key: "wp", header: "W′ spent", cell: (x) => withUnit(x.w_prime_spent_j / 1000, "kJ", 1) },
  ];
  return (
    <Card label="Efforts above FTP">
      <CardHeader
        title="Efforts above FTP"
        subtitle={`Found automatically: stretches above your FTP of ${num(e.ftp_w)} W lasting 30 s or more, and shorter surges above 120% of it`}
      />
      <div className="tiles" style={{ marginBottom: 12 }}>
        <StatTile label="Efforts" value={num(e.count)} />
        <StatTile label="Time above FTP" value={duration(e.time_above_s)} hint="Every second over it" />
        <StatTile label="Work above FTP" value={num(e.work_above_kj, 1)} unit="kJ" hint="What it cost beyond FTP" />
      </div>
      {e.items.length ? (
        <>
          <div className="table-wrap">
            <DataTable rows={rows} rowKey={(x) => x.start_s} columns={columns} />
          </div>
          {e.items.length > SHOWN ? (
            <button type="button" className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setAll((v) => !v)}>
              {all ? "Show fewer" : `Show all ${e.items.length}`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="small muted">No efforts above FTP in this ride.</p>
      )}
    </Card>
  );
}
