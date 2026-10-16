import { Link } from "react-router-dom";

import type { BestPower } from "@/api";
import { DataTable, type Column } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { durationLabel, num } from "@/lib/format";
import { activityPath } from "@/lib/paths";

import type { CurveRow } from "../lib/types";

/** Table twin of the power curve: each range's best and the workout that set it. */
export function CurveTable({ rows, labelA, labelB }: { rows: CurveRow[]; labelA: string; labelB: string }) {
  const range = (key: "a" | "b", label: string): Column<CurveRow>[] => [
    { key: `${key}-watts`, header: label, cell: (r) => (r[key] ? `${num(r[key].watts)} W` : "—") },
    { key: `${key}-set`, header: "Set on", cell: (r) => <SetBy p={r[key]} /> },
  ];
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.d}
      columns={[
        { key: "d", header: "Duration", cell: (r) => durationLabel(r.d) },
        ...range("a", labelA),
        ...(labelB ? range("b", labelB) : []),
      ]}
    />
  );
}

/** The day a best was set, linking to that workout. */
function SetBy({ p }: { p: BestPower | null }) {
  if (!p) return <span className="muted">—</span>;
  return <Link to={activityPath(p)}>{formatFullDay(p.local_date)}</Link>;
}
