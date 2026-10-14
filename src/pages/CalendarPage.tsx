import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useActivities, useSummary } from "../api/hooks";
import type { ActivityRow, Totals } from "../api/types";
import { ErrorState, Loading, StatTile } from "../components/ui";
import { addDays, addMonths, formatMonth, monthEnd, monthStart, today, weekStart } from "../lib/dates";
import { hoursMinutes, num, sportLabel } from "../lib/format";
import "./calendar.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const month = monthStart(params.get("month") ? `${params.get("month")}-01` : today());
  const first = weekStart(month);
  const last = addDays(weekStart(monthEnd(month)), 6);
  const activities = useActivities({ start_date: first, end_date: last, limit: 2000 });
  const weeks = useSummary({ start_date: first, end_date: last, group_by: "week" });
  const monthTotals = useSummary({ start_date: month, end_date: monthEnd(month), group_by: "month" });

  const byDay = useMemo(() => {
    const map = new Map<string, ActivityRow[]>();
    for (const a of activities.data ?? []) {
      const list = map.get(a.local_date) ?? [];
      list.push(a);
      map.set(a.local_date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [activities.data]);
  const weekTotals = new Map((weeks.data?.periods ?? []).map((p) => [p.period, p.total]));
  const weekStarts: string[] = [];
  for (let w = first; w <= last; w = addDays(w, 7)) weekStarts.push(w);
  const go = (delta: number) => setParams({ month: addMonths(month, delta).slice(0, 7) });
  const totals = monthTotals.data?.periods[0]?.total;
  const now = today();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{formatMonth(month)}</h1>
          <p>Workouts by day with weekly totals. Select a workout for its analysis.</p>
        </div>
        <div className="filters">
          <button type="button" className="btn" onClick={() => go(-1)} aria-label="Previous month">
            ←
          </button>
          <button type="button" className="btn" onClick={() => setParams({})}>
            Today
          </button>
          <button type="button" className="btn" onClick={() => go(1)} aria-label="Next month">
            →
          </button>
        </div>
      </div>

      {totals ? (
        <div className="tiles">
          <StatTile label="Workouts" value={String(totals.count)} />
          <StatTile label="Time" value={num(totals.moving_hours, 1)} unit="h" />
          <StatTile label="Distance" value={num(totals.distance_km)} unit="km" />
          <StatTile label="Elevation" value={num(totals.elevation_gain_m)} unit="m" />
          <StatTile label="TSS" value={num(totals.tss)} hint={totals.unscored ? `${totals.unscored} without TSS` : undefined} />
          <StatTile label="Work" value={num(totals.work_kj)} unit="kJ" />
        </div>
      ) : null}

      <section className="card calendar-card" aria-label={`Calendar for ${formatMonth(month)}`}>
        {activities.isError ? (
          <ErrorState error={activities.error} />
        ) : activities.isPending ? (
          <Loading />
        ) : (
          <div className={activities.isFetching ? "calendar refetching" : "calendar"} role="grid">
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
                  const items = byDay.get(day) ?? [];
                  const outside = day.slice(0, 7) !== month.slice(0, 7);
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      className={["cal-day", outside ? "outside" : "", day === now ? "today" : ""].join(" ")}
                    >
                      <div className="cal-date">{Number(day.slice(8))}</div>
                      {items.map((a) => (
                        <WorkoutCard key={`${a.source}/${a.source_id}`} activity={a} />
                      ))}
                    </div>
                  );
                })}
                <WeekCell totals={weekTotals.get(w)} future={w > now} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function WorkoutCard({ activity: a }: { activity: ActivityRow }) {
  const navigate = useNavigate();
  const to = `/activities/${encodeURIComponent(a.source)}/${encodeURIComponent(a.source_id)}`;
  return (
    <Link
      to={to}
      className="workout"
      title={a.name ?? sportLabel(a.sport)}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      <div className="workout-top">
        <span className="sport">{sportLabel(a.sport)}</span>
        <span>{hoursMinutes(a.moving_s ?? a.timer_s ?? a.duration_s)}</span>
      </div>
      <div className="workout-name">{a.name ?? "Untitled"}</div>
      <div className="workout-metrics">
        {a.tss !== null ? <span>{num(a.tss)} TSS</span> : <span className="muted">no TSS</span>}
        {a.intensity_factor !== null ? <span>IF {num(a.intensity_factor, 2)}</span> : null}
        {a.distance_m ? <span>{num(a.distance_m / 1000, 1)} km</span> : null}
      </div>
    </Link>
  );
}

function WeekCell({ totals, future }: { totals: Totals | undefined; future: boolean }) {
  return (
    <div className="cal-week" role="gridcell">
      {totals && totals.count ? (
        <dl>
          <dt>Time</dt>
          <dd>{num(totals.moving_hours, 1)} h</dd>
          <dt>Dist.</dt>
          <dd>{num(totals.distance_km)} km</dd>
          <dt>TSS</dt>
          <dd>{num(totals.tss)}</dd>
          <dt>Work</dt>
          <dd>{num(totals.work_kj)} kJ</dd>
        </dl>
      ) : future ? null : (
        <span className="muted small">Rest</span>
      )}
    </div>
  );
}
