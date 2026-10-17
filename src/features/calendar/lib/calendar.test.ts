import type { ActivityRow, NutritionDay } from "@/api";
import { monthStart, today } from "@/lib/dates";

import { groupByDay, monthEnergy, monthFromParam, monthGrid } from "./calendar";

describe("calendar", () => {
  it("reads ?month= and falls back to the current month", () => {
    expect(monthFromParam("2026-09")).toBe("2026-09-01");
    for (const bad of [null, "", "2025-13", "2026-9", "x"]) expect(monthFromParam(bad)).toBe(monthStart(today()));
  });

  it("covers a month with whole Monday-to-Sunday weeks", () => {
    const grid = monthGrid("2026-10-01"); // Thursday to Saturday
    expect(grid.first).toBe("2026-09-28");
    expect(grid.last).toBe("2026-11-01");
    expect(grid.weekStarts).toEqual(["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
  });

  it("groups workouts by day in start order", () => {
    const row = (id: string, local_date: string, start_time: string) => ({ source_id: id, local_date, start_time }) as ActivityRow;
    const byDay = groupByDay([row("b", "2026-10-01", "2026-10-01T17:00:00Z"), row("a", "2026-10-01", "2026-10-01T06:00:00Z")]);
    expect(byDay.get("2026-10-01")!.map((a) => a.source_id)).toEqual(["a", "b"]);
  });

  it("averages energy over logged days of the month only", () => {
    const day = (date: string, kcal: number | null, entries: number, total: number | null) =>
      ({ date, entries, intake: { kcal }, total_kcal: total }) as NutritionDay;
    const days = [day("2026-09-30", 9000, 3, 9000), day("2026-10-01", 2000, 2, 3000), day("2026-10-02", null, 0, 2800), day("2026-10-03", 3000, 4, null)];
    expect(monthEnergy(days, "2026-10-01")).toEqual({ eaten: 2500, burned: 2900 });
    expect(monthEnergy([], "2026-10-01")).toEqual({ eaten: null, burned: null });
  });
});
