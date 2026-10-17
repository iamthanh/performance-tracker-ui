import type { ActivityRow, NutritionDay, Totals } from "@/api";
import { addDays, type ISODate } from "@/lib/dates";

import { WEEKDAYS } from "../lib/calendar";
import { CalendarDay } from "./CalendarDay";
import { WeekCell } from "./WeekCell";

/** A month as week rows of seven days plus the week's totals. */
export function CalendarGrid({
  month,
  today,
  weekStarts,
  byDay,
  weekTotals,
  energyByDay,
  refetching,
}: {
  month: ISODate;
  today: ISODate;
  weekStarts: ISODate[];
  byDay: Map<ISODate, ActivityRow[]>;
  weekTotals: Map<ISODate, Totals>;
  energyByDay: Map<ISODate, NutritionDay>;
  refetching: boolean;
}) {
  return (
    <div className={refetching ? "calendar refetching" : "calendar"} role="grid">
      <div className="cal-row cal-header" role="row">
        {WEEKDAYS.map((d) => (
          <div key={d} role="columnheader">
            {d}
          </div>
        ))}
        <div role="columnheader">Week</div>
      </div>
      {weekStarts.map((w) => (
        <div className="cal-row" role="row" key={w}>
          {WEEKDAYS.map((_, i) => {
            const day = addDays(w, i);
            return (
              <CalendarDay
                key={day}
                day={day}
                workouts={byDay.get(day) ?? []}
                outside={day.slice(0, 7) !== month.slice(0, 7)}
                isToday={day === today}
                energy={energyByDay.get(day)}
              />
            );
          })}
          <WeekCell totals={weekTotals.get(w)} future={addDays(w, 6) >= today} />
        </div>
      ))}
    </div>
  );
}
