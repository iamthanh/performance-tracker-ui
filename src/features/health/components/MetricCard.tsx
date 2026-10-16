import { ChartCard, DailyLineChart, DataTable, Empty } from "@/components";
import { formatFullDay, type DatedValue } from "@/lib/dates";
import { num } from "@/lib/format";
import type { Token } from "@/lib/theme";

/** One daily metric as a line, with a table twin. */
export function MetricCard({
  title,
  subtitle,
  unit,
  data,
  token,
  digits = 0,
}: {
  title: string;
  subtitle?: string;
  unit: string;
  data: DatedValue[];
  token: Token;
  digits?: number;
}) {
  return (
    <ChartCard
      title={title}
      subtitle={subtitle ?? unit}
      table={() => (
        <DataTable
          rows={[...data].reverse()}
          rowKey={(p) => p.date}
          columns={[
            { key: "date", header: "Date", cell: (p) => formatFullDay(p.date) },
            { key: "value", header: unit, cell: (p) => num(p.value, digits) },
          ]}
        />
      )}
    >
      {data.length ? (
        <DailyLineChart data={data} token={token} unit={unit} digits={digits} syncId="health" />
      ) : (
        <Empty title={`No ${title.toLowerCase()} data in this range`} />
      )}
    </ChartCard>
  );
}
