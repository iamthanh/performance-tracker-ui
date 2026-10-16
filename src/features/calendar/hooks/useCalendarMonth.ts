import { useSearchParams } from "react-router-dom";

import { addMonths } from "@/lib/dates";

import { monthFromParam } from "../lib/calendar";

/** The month shown, kept in the URL (`?month=YYYY-MM`) so it survives reloads and back/forward. */
export function useCalendarMonth() {
  const [params, setParams] = useSearchParams();
  const month = monthFromParam(params.get("month"));
  return {
    month,
    go: (delta: number) => setParams({ month: addMonths(month, delta).slice(0, 7) }),
    reset: () => setParams({}),
  };
}
