import type { KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { ActivityRow } from "@/api";
import { Badge, DataTable, type Column } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { duration, isNum, num, pct, sportLabel } from "@/lib/format";
import { activityPath } from "@/lib/paths";

import { ariaSort, type Sort, type SortKey } from "../lib/sorting";
import { SortButton } from "./SortButton";

/** The sortable metric columns, in display order. */
const METRIC_COLUMNS: { key: Exclude<SortKey, "local_date">; label: string; cell: (a: ActivityRow) => ReactNode }[] = [
  { key: "moving_s", label: "Time", cell: (a) => duration(a.moving_s ?? a.timer_s) },
  { key: "distance_m", label: "Distance", cell: (a) => (isNum(a.distance_m) ? `${num(a.distance_m / 1000, 1)} km` : "—") },
  {
    key: "tss",
    label: "TSS",
    cell: (a) => (
      <>
        {num(a.tss)}
        {a.tss_method === "hr" ? <span className="muted small"> hr</span> : null}
      </>
    ),
  },
  { key: "intensity_factor", label: "IF", cell: (a) => num(a.intensity_factor, 2) },
  { key: "normalized_power_w", label: "NP", cell: (a) => (isNum(a.normalized_power_w) ? `${num(a.normalized_power_w)} W` : "—") },
  { key: "avg_hr", label: "Avg HR", cell: (a) => num(a.avg_hr) },
];

/** One row per workout; headers sort, rows open the workout (click, Enter or Space). */
export function ActivitiesTable({ rows, sort, onSort }: { rows: ActivityRow[]; sort: Sort; onSort: (key: SortKey) => void }) {
  const navigate = useNavigate();
  const sortHeader = (key: SortKey, label: string) => ({
    header: <SortButton column={key} label={label} sort={sort} onSort={onSort} />,
    headerProps: { "aria-sort": ariaSort(sort, key) },
  });

  const columns: Column<ActivityRow>[] = [
    { key: "local_date", ...sortHeader("local_date", "Date"), headerClassName: "left", cell: (a) => formatFullDay(a.local_date) },
    {
      key: "name",
      header: "Workout",
      headerClassName: "left",
      cellClassName: "left",
      cell: (a) => (
        <>
          <Badge>{sportLabel(a.sport)}</Badge> {a.name ?? "Untitled"}
          {!a.has_streams ? <span className="muted small"> · summary only</span> : null}
        </>
      ),
    },
    ...METRIC_COLUMNS.map((c) => ({ key: c.key, ...sortHeader(c.key, c.label), cell: c.cell })),
    { key: "decoupling", header: "Decoupling", cell: (a) => pct(a.decoupling_pct) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(a) => `${a.source}/${a.source_id}`}
      rowProps={(a) => {
        const open = () => navigate(activityPath(a));
        return {
          className: "clickable",
          tabIndex: 0,
          onClick: open,
          onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          },
        };
      }}
    />
  );
}
