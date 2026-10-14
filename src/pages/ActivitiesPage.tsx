import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useActivities } from "../api/hooks";
import type { ActivityRow } from "../api/types";
import { Empty, ErrorState, Loading, Segmented } from "../components/ui";
import { RANGE_PRESETS, formatFullDay, presetRange } from "../lib/dates";
import { duration, isNum, num, pct, sportLabel } from "../lib/format";

type SortKey = "local_date" | "moving_s" | "distance_m" | "tss" | "intensity_factor" | "normalized_power_w" | "avg_hr";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "moving_s", label: "Time" },
  { key: "distance_m", label: "Distance" },
  { key: "tss", label: "TSS" },
  { key: "intensity_factor", label: "IF" },
  { key: "normalized_power_w", label: "NP" },
  { key: "avg_hr", label: "Avg HR" },
];

const SPORTS = [
  { value: "", label: "All sports" },
  { value: "cycling", label: "Rides" },
  { value: "running", label: "Runs" },
  { value: "walking", label: "Walks" },
  { value: "hiking", label: "Hikes" },
];

export function ActivitiesPage() {
  const [presetId, setPresetId] = useState("1y");
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "local_date", desc: true });
  const preset = RANGE_PRESETS.find((p) => p.id === presetId)!;
  const range = presetRange(preset);
  const activities = useActivities({
    start_date: range.start,
    end_date: range.end,
    activity_type: sport || undefined,
    limit: 20000,
  });
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = (activities.data ?? []).filter((a) => !needle || (a.name ?? "").toLowerCase().includes(needle));
    const value = (a: ActivityRow) => (sort.key === "moving_s" ? (a.moving_s ?? a.timer_s) : a[sort.key]);
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va === vb) return b.start_time.localeCompare(a.start_time);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = va < vb ? -1 : 1;
      return sort.desc ? -cmp : cmp;
    });
  }, [activities.data, search, sort]);

  const header = (key: SortKey, label: string, left = false) => (
    <th
      key={key}
      className={left ? "left" : undefined}
      aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        className="btn ghost small"
        style={{ padding: 0, fontWeight: 550 }}
        onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : true })}
      >
        {label}
        {sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Activities</h1>
          <p>One row per workout (duplicates from other services are merged).</p>
        </div>
      </div>
      <div className="filters">
        <Segmented
          label="Date range"
          value={presetId}
          onChange={setPresetId}
          options={RANGE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <Segmented label="Sport" value={sport} onChange={setSport} options={SPORTS} />
        <label className="field" style={{ flexDirection: "row", alignItems: "center" }}>
          <span className="sr-only">Search names</span>
          <input type="search" placeholder="Search names" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>
      <section className="card" style={{ padding: 0 }} aria-label="Activities">
        {activities.isError ? (
          <ErrorState error={activities.error} />
        ) : activities.isPending ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No workouts match" />
        ) : (
          <div className={activities.isFetching ? "table-wrap refetching" : "table-wrap"}>
            <table className="data">
              <thead>
                <tr>
                  {header("local_date", "Date", true)}
                  <th className="left">Workout</th>
                  {COLUMNS.map((c) => header(c.key, c.label))}
                  <th>Decoupling</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const to = `/activities/${encodeURIComponent(a.source)}/${encodeURIComponent(a.source_id)}`;
                  return (
                    <tr
                      key={`${a.source}/${a.source_id}`}
                      className="clickable"
                      tabIndex={0}
                      onClick={() => navigate(to)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(to);
                        }
                      }}
                    >
                      <td>{formatFullDay(a.local_date)}</td>
                      <td className="left">
                        <span className="badge">{sportLabel(a.sport)}</span> {a.name ?? "Untitled"}
                        {!a.has_streams ? <span className="muted small"> · summary only</span> : null}
                      </td>
                      <td>{duration(a.moving_s ?? a.timer_s)}</td>
                      <td>{isNum(a.distance_m) ? `${num(a.distance_m / 1000, 1)} km` : "—"}</td>
                      <td>
                        {num(a.tss)}
                        {a.tss_method === "hr" ? <span className="muted small"> hr</span> : null}
                      </td>
                      <td>{num(a.intensity_factor, 2)}</td>
                      <td>{isNum(a.normalized_power_w) ? `${num(a.normalized_power_w)} W` : "—"}</td>
                      <td>{num(a.avg_hr)}</td>
                      <td>{pct(a.decoupling_pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {activities.data ? <p className="small muted">{rows.length} workouts</p> : null}
    </>
  );
}
