import type { LoadDay } from "@/api";
import { DataTable } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";

/** Table twin of the fitness and form charts, newest day first. */
export function LoadTable({ days }: { days: LoadDay[] }) {
  return (
    <DataTable
      rows={[...days].reverse()}
      rowKey={(d) => d.date}
      columns={[
        { key: "date", header: "Date", cell: (d) => formatFullDay(d.date) },
        { key: "tss", header: "TSS", cell: (d) => num(d.tss) },
        { key: "ctl", header: "Fitness", cell: (d) => num(d.ctl, 1) },
        { key: "atl", header: "Fatigue", cell: (d) => num(d.atl, 1) },
        { key: "tsb", header: "Form", cell: (d) => signed(d.tsb) },
        { key: "unscored", header: "Unscored", cell: (d) => d.unscored || "" },
      ]}
    />
  );
}
