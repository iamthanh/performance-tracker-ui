import type { NutritionDay } from "@/api";

import { energyPoints } from "./energy";

const day = (date: string, entries: number, kcal: number | null, total: number | null) =>
  ({ date, entries, intake: { kcal }, total_kcal: total, workout_kcal: null, balance_kcal: null }) as NutritionDay;

it("keeps the whole range when there is any data", () => {
  const points = energyPoints([day("2026-10-01", 0, null, null), day("2026-10-02", 2, 1800, null), day("2026-10-03", 0, null, 2900)]);
  expect(points.map((p) => [p.date, p.eaten, p.burned])).toEqual([
    ["2026-10-01", null, null],
    ["2026-10-02", 1800, null],
    ["2026-10-03", null, 2900],
  ]);
  expect(energyPoints([day("2026-10-01", 0, null, null)])).toEqual([]);
});
