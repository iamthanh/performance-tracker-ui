import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  axisProps,
  barCursor,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  Empty,
  gridProps,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { formatDay, formatFullDay } from "@/lib/dates";
import { hoursMinutes } from "@/lib/format";
import type { Token } from "@/lib/theme";

import type { Night } from "../lib/types";

/** Sleep stages bottom to top; awake is the cap with the rounded corners. */
const STAGES: { key: "deep" | "light" | "rem" | "awake"; label: string; token: Token }[] = [
  { key: "deep", label: "Deep", token: "series-1" },
  { key: "light", label: "Light", token: "series-2" },
  { key: "rem", label: "REM", token: "series-3" },
  { key: "awake", label: "Awake", token: "series-4" },
];

const hours = (h: number) => hoursMinutes(h * 3600);

/** Hours per night by sleep stage, stacked. */
export function SleepCard({ nights, refetching }: { nights: Night[]; refetching: boolean }) {
  const c = useColors();
  return (
    <ChartCard
      title="Sleep"
      subtitle="Hours per night by stage"
      refetching={refetching}
      legend={STAGES.map((s) => ({ label: s.label, color: c[s.token], shape: "rect" as const }))}
      table={() => <SleepTable nights={nights} />}
    >
      {nights.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={nights} margin={CHART_MARGIN} barCategoryGap={2}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="date" {...axisProps(c)} tickFormatter={formatDay} minTickGap={40} />
            <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} unit=" h" />
            <Tooltip
              cursor={barCursor(c, 0.35)}
              content={tooltipContent<Night>((n) => (
                <TooltipBox
                  title={`Night ending ${formatFullDay(n.date)}`}
                  rows={STAGES.map((s) => ({ name: s.label, value: hours(n[s.key]), color: c[s.token] }))}
                />
              ))}
            />
            {STAGES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="sleep"
                fill={c[s.token]}
                stroke={c["surface-1"]}
                strokeWidth={2}
                maxBarSize={24}
                radius={s.key === "awake" ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty title="No sleep data in this range" />
      )}
    </ChartCard>
  );
}

function SleepTable({ nights }: { nights: Night[] }) {
  return (
    <DataTable
      rows={[...nights].reverse()}
      rowKey={(n) => n.date}
      columns={[
        { key: "date", header: "Night ending", cell: (n) => formatFullDay(n.date) },
        { key: "asleep", header: "Asleep", cell: (n) => hoursMinutes((n.asleep ?? 0) * 60) },
        ...STAGES.map((s) => ({ key: s.key, header: s.label, cell: (n: Night) => hours(n[s.key]) })),
      ]}
    />
  );
}
