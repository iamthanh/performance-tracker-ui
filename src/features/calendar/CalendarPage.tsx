import { Card, ErrorState, Loading, PageHeader } from "@/components";
import { formatMonth, today } from "@/lib/dates";

import "./calendar.css";
import { CalendarGrid } from "./components/CalendarGrid";
import { MonthNav } from "./components/MonthNav";
import { MonthTotals } from "./components/MonthTotals";
import { useCalendarData } from "./hooks/useCalendarData";
import { useCalendarMonth } from "./hooks/useCalendarMonth";

/** A month of workouts by day, with weekly and monthly totals. */
export function CalendarPage() {
  const { month, go, reset } = useCalendarMonth();
  const { activities, monthTotals, weekStarts, byDay, weekTotals } = useCalendarData(month);
  const totals = monthTotals.data?.periods[0]?.total;

  return (
    <>
      <PageHeader
        title={formatMonth(month)}
        description="Workouts by day with weekly totals. Select a workout for its analysis."
        actions={<MonthNav onPrevious={() => go(-1)} onToday={reset} onNext={() => go(1)} />}
      />

      {totals ? <MonthTotals totals={totals} refetching={monthTotals.isPlaceholderData} /> : null}

      <Card label={`Calendar for ${formatMonth(month)}`} className="calendar-card">
        {activities.isError ? (
          <ErrorState error={activities.error} />
        ) : activities.isPending ? (
          <Loading />
        ) : (
          <CalendarGrid
            month={month}
            today={today()}
            weekStarts={weekStarts}
            byDay={byDay}
            weekTotals={weekTotals}
            refetching={activities.isFetching}
          />
        )}
      </Card>
    </>
  );
}
