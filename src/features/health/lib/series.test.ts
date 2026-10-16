import type { DailyMetric } from "@/api";

import { average, metricSeries, onePerDay, weekOverWeek } from "./series";

const metric = (source: string, date: string, value: number) => ({ source, date, metric: "resting_hr", value }) as DailyMetric;

describe("health series", () => {
  it("takes one value per day from the preferred source", () => {
    const rows = [metric("google_health", "2026-10-01", 60), metric("garmin", "2026-10-01", 50), metric("other", "2026-10-02", 55)];
    expect(metricSeries(rows, "resting_hr")).toEqual([
      { date: "2026-10-01", value: 50 },
      { date: "2026-10-02", value: 55 },
    ]);
  });

  it("keeps the latest item of the preferred source per day", () => {
    const items = [
      { day: "d1", source: "garmin", at: "1" },
      { day: "d1", source: "garmin", at: "2" },
      { day: "d1", source: "google_health", at: "3" },
    ];
    expect(onePerDay(items, (i) => i.day, (i) => i.source, (i) => i.at)).toEqual([items[1]]);
  });

  it("averages a trailing window and compares weeks", () => {
    const series = Array.from({ length: 14 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, value: i < 7 ? 50 : 52 }));
    expect(average(series, 7, "2026-10-14")).toBe(52);
    expect(average(series, 7, "2026-09-30")).toBeNull();
    expect(weekOverWeek(series, "2026-10-14", "bpm")).toBe("+2.0 bpm vs prior week");
  });
});
