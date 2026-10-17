import { useState } from "react";
import { Link } from "react-router-dom";

import type { Performance, PerformanceEvent } from "@/api";
import { Card, CardHeader, DataTable } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";
import { activityPath } from "@/lib/paths";

import { newestFirst, splitText } from "../lib/performance";

const SHOWN = 8;

/** The new bests that raised the index in the range, newest first, each with the ride that set it. */
export function PerformanceChangesCard({ perf }: { perf: Performance }) {
  const [all, setAll] = useState(false);
  const events = newestFirst(perf.events);
  const label = Object.fromEntries(perf.components.map((k) => [k.key, k.label]));
  const unit = Object.fromEntries(perf.components.map((k) => [k.key, k.unit]));
  const value = (e: PerformanceEvent, v: number) => (unit[e.component] === "share" ? `${num(v * 100)} %` : `${num(v, 2)} W/kg`);
  return (
    <Card label="What raised the index">
      <CardHeader
        title="What raised the index"
        subtitle="New bests in the range, newest first, and whether more power or less weight did it. Between them, a component eases down slowly until you test it again."
      />
      {events.length ? (
        <>
          <div className="table-wrap">
            <DataTable
              rows={all ? events : events.slice(0, SHOWN)}
              rowKey={(e) => `${e.date}/${e.component}`}
              columns={[
                { key: "date", header: "Date", cell: (e) => formatFullDay(e.date), headerClassName: "left", cellClassName: "left" },
                { key: "component", header: "Component", cell: (e) => label[e.component], headerClassName: "left", cellClassName: "left" },
                { key: "change", header: "Index", cell: (e) => signed(e.index_change, 1) },
                { key: "value", header: "Value", cell: (e) => `${value(e, e.from)} → ${value(e, e.to)}` },
                {
                  key: "why",
                  header: "From",
                  cell: (e) => {
                    const why = splitText(e.split);
                    const ride = e.ride;
                    const effort = ride?.watts && ride.kg ? `${num(ride.watts)} W at ${num(ride.kg, 1)} kg` : null;
                    return (
                      <>
                        {why ?? effort ?? "—"}
                        {why && effort ? <div className="small muted">{effort}</div> : null}
                        {ride?.weight_kind === "estimated" ? <div className="small muted">⚠ estimated weight (long gap)</div> : null}
                      </>
                    );
                  },
                  headerClassName: "left",
                  cellClassName: "left",
                },
                {
                  key: "ride",
                  header: "Ride",
                  cell: (e) => (e.ride ? <Link to={activityPath(e.ride)}>{e.ride.name ?? "Ride"}</Link> : "—"),
                  headerClassName: "left",
                  cellClassName: "left",
                },
              ]}
            />
          </div>
          {events.length > SHOWN ? (
            <button type="button" className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setAll((v) => !v)}>
              {all ? "Show fewer" : `Show all ${events.length}`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="small muted">No new bests in this range: every component is easing from its last test.</p>
      )}
    </Card>
  );
}
