import type { ActivityRow } from "@/api";
import type { ISODate } from "@/lib/dates";

import { WorkoutCard } from "./WorkoutCard";

export function CalendarDay({
  day,
  workouts,
  outside,
  isToday,
}: {
  day: ISODate;
  workouts: ActivityRow[];
  /** In the previous or next month. */
  outside: boolean;
  isToday: boolean;
}) {
  return (
    <div role="gridcell" className={["cal-day", outside ? "outside" : "", isToday ? "today" : ""].join(" ")}>
      <div className="cal-date">{Number(day.slice(8))}</div>
      {workouts.map((a) => (
        <WorkoutCard key={`${a.source}/${a.source_id}`} activity={a} />
      ))}
    </div>
  );
}
