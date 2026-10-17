import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useNutritionDaily } from "@/api";
import {
  axisProps,
  barCursor,
  CHART_MARGIN,
  ChartCard,
  DataTable,
  Empty,
  ErrorState,
  gridProps,
  tooltipContent,
  TooltipBox,
  Y_AXIS_WIDTH,
} from "@/components";
import { useColors } from "@/hooks";
import { formatFullDay } from "@/lib/dates";
import { num, signed } from "@/lib/format";

import { energyPoints, type EnergyPoint } from "../lib/energy";
import type { DateTick } from "../lib/types";

/** Calories eaten (bars) against burned (the watch's daily total, line), per day. */
export function EnergyCard({ start, end, tick }: { start: string; end: string; tick: DateTick }) {
  const c = useColors();
  const daily = useNutritionDaily({ start_date: start, end_date: end });
  const points = energyPoints(daily.data ?? []);
  return (
    <ChartCard
      title="Energy in and out"
      subtitle="Calories eaten (logged on the Nutrition page) and burned (your watch's daily total), kcal per day"
      refetching={daily.isFetching}
      legend={[
        { label: "Eaten", color: c["series-1"], shape: "rect" },
        { label: "Burned", color: c["series-2"] },
      ]}
      table={() => <EnergyTable points={points} />}
    >
      {daily.isError ? (
        <ErrorState error={daily.error} />
      ) : !points.length ? (
        <Empty title="No calories logged or synced in this range">
          Log meals on the Nutrition page; burned calories come from Garmin once it is synced.
        </Empty>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={points} margin={CHART_MARGIN}>
            <CartesianGrid {...gridProps(c)} />
            <XAxis dataKey="date" {...axisProps(c)} tickFormatter={tick} minTickGap={40} />
            <YAxis {...axisProps(c)} width={Y_AXIS_WIDTH} />
            <Tooltip
              cursor={barCursor(c, 0.35)}
              content={tooltipContent<EnergyPoint>((p) => (
                <TooltipBox
                  title={formatFullDay(p.date)}
                  rows={[
                    { name: "Eaten", value: p.eaten === null ? "—" : `${num(p.eaten)} kcal`, color: c["series-1"] },
                    { name: "Burned", value: p.burned === null ? "—" : `${num(p.burned)} kcal`, color: c["series-2"] },
                    { name: "Workouts", value: p.workouts === null ? "—" : `${num(p.workouts)} kcal` },
                    { name: "Balance", value: p.balance === null ? "—" : `${signed(p.balance, 0)} kcal` },
                  ]}
                />
              ))}
            />
            <Bar dataKey="eaten" fill={c["series-1"]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Line dataKey="burned" stroke={c["series-2"]} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function EnergyTable({ points }: { points: EnergyPoint[] }) {
  return (
    <DataTable
      rows={[...points].reverse()}
      rowKey={(p) => p.date}
      columns={[
        { key: "date", header: "Date", cell: (p) => formatFullDay(p.date) },
        { key: "eaten", header: "Eaten (kcal)", cell: (p) => num(p.eaten) },
        { key: "burned", header: "Burned (kcal)", cell: (p) => num(p.burned) },
        { key: "workouts", header: "Workouts (kcal)", cell: (p) => num(p.workouts) },
        { key: "balance", header: "Balance (kcal)", cell: (p) => (p.balance === null ? "—" : signed(p.balance, 0)) },
      ]}
    />
  );
}
