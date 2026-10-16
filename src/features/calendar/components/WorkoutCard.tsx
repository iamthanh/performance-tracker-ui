import { Link, useNavigate } from "react-router-dom";

import type { ActivityRow } from "@/api";
import { hoursMinutes, num, sportLabel } from "@/lib/format";
import { activityPath } from "@/lib/paths";

/** A workout in a calendar day: sport, time, name and its load. Links to the workout. */
export function WorkoutCard({ activity: a }: { activity: ActivityRow }) {
  const navigate = useNavigate();
  const to = activityPath(a);
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
