import { usePerformance } from "@/api";
import { EmptyCard, ErrorCard, LoadingCard } from "@/components";
import { dateTickFormatter, daysBetween } from "@/lib/dates";

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
    return (
      <EmptyCard title="No performance index yet">
        It needs rides with power: import them, then run <code>fitness-hub analyze</code>.
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
