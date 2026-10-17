import type { ActivityRow } from "@/api";

export type SortKey =
  | "local_date"
  | "moving_s"
  | "distance_m"
  | "tss"
  | "intensity_factor"
  | "normalized_power_w"
  | "avg_hr"
  | "kcal";
export type Sort = { key: SortKey; desc: boolean };

export const DEFAULT_SORT: Sort = { key: "local_date", desc: true };

/** Clicking a column sorts by it, largest first; clicking it again flips the order. */
export function nextSort(current: Sort, key: SortKey): Sort {
  return { key, desc: current.key === key ? !current.desc : true };
}

/** Workouts whose name contains `search` (case-insensitive), sorted; ties and missing values go newest first / last. */
export function filterAndSort(activities: ActivityRow[], search: string, sort: Sort): ActivityRow[] {
  const needle = search.trim().toLowerCase();
  const filtered = activities.filter((a) => !needle || (a.name ?? "").toLowerCase().includes(needle));
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
}

/** `aria-sort` for a column header. */
export function ariaSort(sort: Sort, column: SortKey): "ascending" | "descending" | "none" {
  return sort.key === column ? (sort.desc ? "descending" : "ascending") : "none";
}
