import { useState } from "react";
import { Link } from "react-router-dom";

import type { CardioModel, CardioRide } from "@/api";
import { Card, CardHeader, DataTable } from "@/components";
import { correctionParts } from "@/lib/cardio";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import { activityPath } from "@/lib/paths";


const SHOWN = 10;

/** How heart rate is put on the same footing (what was fitted to your rides), and each ride's value before and
 *  after, newest first. */
export function CardioModelCard({ model, rides }: { model: CardioModel; rides: CardioRide[] }) {
  const [all, setAll] = useState(false);
  const c = model.corrections;
  const ref = model.reference;
  const fitted = (key: keyof CardioModel["fitted"]) => (model.fitted[key] ? "" : " (default: too few rides to fit)");
  const valued = rides.filter((r) => r.bpm !== null).reverse();
  return (
    <Card label="How the cardio index is measured">
      <CardHeader
        title="How it is measured"
        subtitle={`From ${num(model.blocks)} steady 5-minute blocks in ${num(model.rides)} rides (even power after 3 minutes at it, from 20 minutes in). These are fitted to your own rides.${
          model.outliers ? ` ${model.outliers} ride${model.outliers === 1 ? " was" : "s were"} left out: still over 20 bpm from the rides around ${model.outliers === 1 ? "it" : "them"} once corrected, a heart-rate sensor problem.` : ""
        }`}
      />
      <ul className="small" style={{ marginTop: 0 }}>
        <li>
          <strong>Reference:</strong> {num(ref.power_w)} W and {num(ref.hr_bpm)} bpm
          {ref.power_auto || ref.hr_auto ? " (automatic: the median of your steady riding; change it in Settings)" : " (set in Settings)"}.
        </li>
        <li>
          <strong>Same power:</strong> {num(model.slope_bpm_per_w, 2)} bpm per W within a ride (1 bpm ≈ {num(1 / model.slope_bpm_per_w, 1)} W)
          {fitted("slope")}, and {num(model.drift_bpm_per_1000kj, 1)} bpm more per 1000 kJ already done.
        </li>
        <li>
          <strong>Indoors:</strong> {signed(c.indoor_bpm, 1)} bpm against outdoors (another power meter, a fan){fitted("indoor")}.
        </li>
        <li>
          <strong>Heat:</strong> {signed(c.heat_bpm_per_c, 2)} bpm per °C above {c.heat_from_c} °C{fitted("heat")}.
        </li>
        <li>
          <strong>Fatigue:</strong> {num(c.form_bpm_per_tsb, 2)} bpm per point of form (TSB): tired, your heart rate reads low (TSB −30 ≈{" "}
          {signed(-30 * c.form_bpm_per_tsb, 1)} bpm), which would otherwise look like fitness{fitted("form")}.
        </li>
      </ul>
      {valued.length ? (
        <>
          <div className="table-wrap">
            <DataTable
              rows={all ? valued : valued.slice(0, SHOWN)}
              rowKey={(r) => `${r.source}/${r.source_id}`}
              columns={[
                { key: "date", header: "Date", cell: (r) => formatFullDay(r.date), headerClassName: "left", cellClassName: "left" },
                {
                  key: "ride",
                  header: "Ride",
                  cell: (r) => <Link to={activityPath(r)}>{r.name ?? "Ride"}</Link>,
                  headerClassName: "left",
                  cellClassName: "left",
                },
                { key: "blocks", header: "Blocks", cell: (r) => num(r.blocks) },
                { key: "raw", header: `HR at ${num(ref.power_w)} W`, cell: (r) => num(r.raw_bpm, 1) },
                {
                  key: "why",
                  header: "Conditions",
                  cell: (r) => correctionParts(r).join(", ") || "—",
                  headerClassName: "left",
                  cellClassName: "left secondary",
                },
                { key: "bpm", header: "Corrected", cell: (r) => num(r.bpm, 1) },
                { key: "power", header: `W at ${num(ref.hr_bpm)} bpm`, cell: (r) => num(r.power_w) },
              ]}
            />
          </div>
          {valued.length > SHOWN ? (
            <button type="button" className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setAll((v) => !v)}>
              {all ? "Show fewer" : `Show all ${valued.length} rides`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="small muted">No rides with steady riding in this range.</p>
      )}
    </Card>
  );
}
