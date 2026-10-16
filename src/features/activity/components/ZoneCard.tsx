import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Zone } from "@/api";
import { axisProps, barCursor, ChartCard, DataTable, tooltipContent, TooltipBox } from "@/components";
import { useColors } from "@/hooks";
import { duration, pct } from "@/lib/format";

import { zoneRows, type ZoneRow } from "../lib/zones";

/** Time in each power or heart-rate zone as horizontal bars, labelled with the time. */
export function ZoneCard({ title, zones, unit, threshold }: { title: string; zones: Zone[]; unit: string; threshold: string }) {
  const c = useColors();
  const data = zoneRows(zones, unit);
  return (
    <ChartCard title={title} subtitle={threshold} table={() => <ZoneTable rows={data} />}>
      <ResponsiveContainer width="100%" height={zones.length * 30 + 10}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="zone" {...axisProps(c)} axisLine={false} width={150} tick={{ fill: c["text-secondary"], fontSize: 12 }} />
          <Tooltip
            cursor={barCursor(c, 0.35)}
            content={tooltipContent<ZoneRow>((z) => (
              <TooltipBox
                title={`${z.zone} · ${z.range}`}
                rows={[
                  { name: "Time", value: duration(z.seconds), color: c["series-1"] },
                  { name: "Share", value: pct(z.share) },
                ]}
              />
            ))}
          />
          <Bar
            dataKey="seconds"
            fill={c["series-1"]}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
            label={{
              position: "right",
              fill: c["text-secondary"],
              fontSize: 11,
              formatter: (v: unknown) => (typeof v === "number" && v > 0 ? duration(v) : ""),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ZoneTable({ rows }: { rows: ZoneRow[] }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(z) => z.zone}
      columns={[
        { key: "zone", header: "Zone", cell: (z) => z.zone },
        { key: "range", header: "Range", cell: (z) => z.range },
        { key: "time", header: "Time", cell: (z) => duration(z.seconds) },
        { key: "share", header: "Share", cell: (z) => pct(z.share) },
      ]}
    />
  );
}
