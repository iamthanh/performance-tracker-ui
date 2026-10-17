import type { PerformanceDay, PerformanceEvent } from "@/api";

import { change, daysSinceTested, newestFirst, scoredDays, splitText, tableDays, weightShares } from "./performance";

const day = (date: string, score: number | null): PerformanceDay =>
  ({ date, score, components: {} as PerformanceDay["components"], efficiency: null }) as PerformanceDay;

describe("performance index helpers", () => {
  it("starts the range at the first scored day", () => {
    expect(scoredDays([day("2026-01-01", null), day("2026-01-02", 98), day("2026-01-03", null)]).map((d) => d.date)).toEqual([
      "2026-01-02",
      "2026-01-03",
    ]);
    expect(scoredDays([day("2026-01-01", null)])).toEqual([]);
  });

  it("measures the change over the range, skipping gaps", () => {
    expect(change([null, 98, 101, null, 104.5])).toEqual({ first: 98, last: 104.5, delta: 6.5 });
    expect(change([null, null])).toEqual({ first: null, last: null, delta: null });
  });

  it("counts days since the last test", () => {
    expect(daysSinceTested("2026-09-01", "2026-10-13")).toBe(42);
    expect(daysSinceTested(null, "2026-10-13")).toBeNull();
  });

  it("turns weights into shares", () => {
    const shares = weightShares({ sprint: 1, anaerobic: 1, vo2max: 2, threshold: 4, endurance: 1, durability: 1 });
    expect(shares.threshold).toBe(40);
    expect(Object.values(shares).reduce((t, v) => t + v, 0)).toBeCloseTo(100);
  });

  it("lists rises newest first and thins long tables to weekly rows ending today", () => {
    const e = (date: string) => ({ date }) as PerformanceEvent;
    expect(newestFirst([e("2026-01-02"), e("2026-03-01"), e("2026-02-01")]).map((x) => x.date)).toEqual([
      "2026-03-01",
      "2026-02-01",
      "2026-01-02",
    ]);
    const days = Array.from({ length: 200 }, (_, i) => day(`d${String(i).padStart(3, "0")}`, i));
    const rows = tableDays(days);
    expect(rows[rows.length - 1]!.date).toBe("d199");
    expect(rows.length).toBe(29);
    expect(tableDays(days.slice(0, 50))).toHaveLength(50);
  });

  it("says whether a rise came from power or weight", () => {
    expect(splitText({ power_pct: 4.7, weight_pct: -1.1 })).toBe("power +4.7 %, 1.1 % lighter");
    expect(splitText({ power_pct: -2, weight_pct: 0.2 })).toBe("power −2.0 %, 0.2 % heavier");
    expect(splitText({ power_pct: 3, weight_pct: 0 })).toBe("power +3.0 %, same weight");
    expect(splitText(null)).toBeNull();
  });
});
