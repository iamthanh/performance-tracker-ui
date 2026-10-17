import type { ActivityRow, NutritionDay } from "@/api";
import { num } from "@/lib/format";
import type { ISODate } from "@/lib/dates";

import { WorkoutCard } from "./WorkoutCard";

export function CalendarDay({
  day,
  workouts,
  outside,
  isToday,
  energy,
}: {
  day: ISODate;
  workouts: ActivityRow[];
  /** In the previous or next month. */
  outside: boolean;
  isToday: boolean;
  /** Energy eaten and burned that day, if any is known. */
  energy?: NutritionDay;
}) {
  const eaten = energy?.entries ? energy.intake.kcal : null;
  const burned = energy?.total_kcal ?? null;
  return (
    <div role="gridcell" className={["cal-day", outside ? "outside" : "", isToday ? "today" : ""].join(" ")}>
      <div className="cal-date">{Number(day.slice(8))}</div>
      {workouts.map((a) => (
        <WorkoutCard key={`${a.source}/${a.source_id}`} activity={a} />
      ))}
      {eaten !== null || burned !== null ? (
        <div className="cal-energy" title="kcal eaten / burned">
          {[eaten !== null ? `In ${num(eaten)}` : null, burned !== null ? `Out ${num(burned)}` : null].filter(Boolean).join(" · ")}
          <span className="sr-only"> kcal eaten / burned</span>
        </div>
      ) : null}
    </div>
  );
}
