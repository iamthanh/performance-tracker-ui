import { useSearchParams } from "react-router-dom";

import { useNutritionDaily, useNutritionEntries } from "@/api";
import { addDays } from "@/lib/dates";

import { dayFromParam } from "../lib/day";

/** The day shown (kept in the URL as `?day=`), its entries and its energy totals. */
export function useNutritionDay() {
  const [params, setParams] = useSearchParams();
  const day = dayFromParam(params.get("day"));
  const entries = useNutritionEntries({ start_date: day, end_date: day });
  const daily = useNutritionDaily({ start_date: day, end_date: day });
  return {
    day,
    go: (delta: number) => setParams({ day: addDays(day, delta) }),
    setDay: (next: string) => setParams({ day: next }),
    reset: () => setParams({}),
    entries,
    totals: daily.data?.[0],
    daily,
  };
}
