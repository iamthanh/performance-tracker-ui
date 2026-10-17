import { usePerformance } from "@/api";
import { EmptyCard, ErrorCard, LoadingCard } from "@/components";
import { dateTickFormatter, daysBetween, formatFullDay } from "@/lib/dates";

import { scoredDays } from "../lib/performance";
import { PerformanceCard } from "./PerformanceCard";
import { PerformanceChangesCard } from "./PerformanceChangesCard";
import { PerformanceComponentsCard } from "./PerformanceComponentsCard";

/** How good you are over the range (from best efforts), above how much you trained (fitness). */
export function PerformanceSection({ range }: { range: { start: string; end: string } }) {
  const perf = usePerformance({ start_date: range.start, end_date: range.end });
  if (perf.isError) return <ErrorCard error={perf.error} />;
  if (perf.isPending) return <LoadingCard label="Loading the performance index…" />;
  const days = scoredDays(perf.data.days);
  if (!days.length) {
    const { first_ride, starts } = perf.data;
    return (
      <EmptyCard title="No performance index yet">
        {!first_ride ? (
          <>
            It needs rides with power: import them, then run <code>fitness-hub analyze</code>.
          </>
        ) : starts && starts > range.end ? (
          <>It starts on {formatFullDay(starts)}, once it has 90 days of your rides to measure from.</>
        ) : (
          <>No scored days in this range: the index starts on {starts ? formatFullDay(starts) : "—"}.</>
        )}
      </EmptyCard>
    );
  }
  const tick = dateTickFormatter(daysBetween(days[0]!.date, days[days.length - 1]!.date));
  return (
    <>
      <PerformanceCard perf={perf.data} days={days} tick={tick} refetching={perf.isFetching} />
      <PerformanceComponentsCard perf={perf.data} days={days} tick={tick} />
      <PerformanceChangesCard perf={perf.data} />
    </>
  );
}
