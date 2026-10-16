import { useMemo, useState } from "react";

import { useActivities } from "@/api";
import { useRangePreset } from "@/hooks";

import { DEFAULT_SORT, filterAndSort, nextSort, type Sort, type SortKey } from "../lib/sorting";

/** The Activities page's filters (range, sport, name search), sort and the resulting rows. */
export function useActivityList() {
  const { presetId, setPresetId, range } = useRangePreset("1y");
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const activities = useActivities({
    start_date: range.start,
    end_date: range.end,
    activity_type: sport || undefined,
    limit: 20000,
  });
  const rows = useMemo(() => filterAndSort(activities.data ?? [], search, sort), [activities.data, search, sort]);

  return {
    activities,
    rows,
    filters: { presetId, setPresetId, sport, setSport, search, setSearch },
    sort,
    sortBy: (key: SortKey) => setSort(nextSort(sort, key)),
  };
}
