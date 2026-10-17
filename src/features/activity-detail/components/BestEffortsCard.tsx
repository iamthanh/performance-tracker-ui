import type { BestEffort } from "@/api";
import { Card, CardHeader, DataTable, type Column } from "@/components";
import { duration, durationLabel, num, withUnit } from "@/lib/format";

import type { Highlight } from "../lib/highlight";
import { wPerKg } from "../lib/insights";

/** For each duration, the stretch of the ride with the highest average power and the heart rate over it.
 *  Picking a row marks that stretch on the workout charts. */
export function BestEffortsCard({
  efforts,
  kg,
  selected,
  onSelect,
}: {
  efforts: BestEffort[];
  kg: number | null;
  selected: Highlight | null;
  onSelect: (h: Highlight | null) => void;
}) {
  const hasHr = efforts.some((e) => e.avg_hr !== null);
  const label = (e: BestEffort) => `Best ${durationLabel(e.duration_s)}`;
  const isSelected = (e: BestEffort) => selected?.label === label(e) && selected.start_s === e.start_s;
  const toggle = (e: BestEffort) => onSelect(isSelected(e) ? null : { start_s: e.start_s, end_s: e.end_s, label: label(e) });
  const columns: Column<BestEffort>[] = [
    {
      key: "d",
      header: "Duration",
      cell: (e) => (
        <button
          type="button"
          className="btn ghost small"
          aria-pressed={isSelected(e)}
          aria-label={`${label(e)}: mark on the charts`}
          onClick={(ev) => {
            ev.stopPropagation(); // the row's own click would toggle it back
            toggle(e);
          }}
        >
          {durationLabel(e.duration_s)}
        </button>
      ),
      headerClassName: "left",
      cellClassName: "left",
    },
    { key: "w", header: "Avg power", cell: (e) => withUnit(e.avg_power_w, "W") },
    ...(kg ? [{ key: "wkg", header: "W/kg", cell: (e: BestEffort) => wPerKg(e.avg_power_w, kg).replace(" W/kg", "") }] : []),
    { key: "when", header: "When", cell: (e) => `${duration(e.start_s)} – ${duration(e.end_s)}` },
    ...(hasHr
      ? [
          { key: "avg_hr", header: "Avg HR", cell: (e: BestEffort) => num(e.avg_hr) },
          { key: "min_hr", header: "Min HR", cell: (e: BestEffort) => num(e.min_hr) },
          { key: "max_hr", header: "Max HR", cell: (e: BestEffort) => num(e.max_hr) },
        ]
      : []),
  ];
  return (
    <Card label="Best efforts">
      <CardHeader
        title="Best efforts"
        subtitle="Your highest average power for each duration in this ride, when it was, and your heart rate over it (bpm). Pick a row to mark it on the charts."
      />
      <div className="table-wrap">
        <DataTable
          columns={columns}
          rows={efforts}
          rowKey={(e) => e.duration_s}
          // The whole row is a mouse target; keyboard and screen readers use the button in its first cell.
          rowProps={(e) => ({ className: isSelected(e) ? "clickable selected" : "clickable", onClick: () => toggle(e) })}
        />
      </div>
    </Card>
  );
}
