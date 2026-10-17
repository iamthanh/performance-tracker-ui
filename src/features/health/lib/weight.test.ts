import type { BodyMeasurement } from "@/api";

import { between, dayNumber, fromDayNumber, weightPoints, weightStats, withBreaks } from "./weight";

const row = (date: string, value: number, source = "weight_csv"): BodyMeasurement => ({
  ts: `${date}T12:00:00Z`,
  metric: "weight_kg",
  source,
  value,
});

describe("weight", () => {
  it("averages each day's sources and the week up to each day, as rides do", () => {
    const points = weightPoints([
      row("2020-03-01", 70),
      row("2020-03-02", 72),
      row("2020-03-02", 71, "garmin"), // two sources: their average
      row("2020-03-09", 74), // a week on: Mar 3-9 holds only itself
      { ...row("2020-03-09", 20), metric: "body_fat_pct" },
    ]);
    expect(points.map((p) => [p.date, p.kg, p.avgKg, p.source])).toEqual([
      ["2020-03-01", 70, 70, "weight_csv"],
      ["2020-03-02", 71.5, 70.75, "garmin, weight_csv"],
      ["2020-03-09", 74, 74, "weight_csv"],
    ]);
    expect(fromDayNumber(dayNumber("2020-03-09"))).toBe("2020-03-09");
  });

  it("sums up a range in the chosen unit", () => {
    const points = weightPoints([row("2020-03-01", 70), row("2020-03-20", 72)]);
    const kg = weightStats(points, "kg")!;
    expect(kg).toMatchObject({ latest: 72, latestDate: "2020-03-20", change: 2, low: 70, high: 72, count: 2 });
    expect(weightStats(points, "lb")!.latest).toBeCloseTo(158.73, 2);
    expect(weightStats([], "kg")).toBeNull();
    expect(between(points, "2020-03-05", "2020-12-31").map((p) => p.date)).toEqual(["2020-03-20"]);
  });

  it("breaks the average line across gaps of over a week", () => {
    const out = withBreaks([{ day: 1 }, { day: 3 }, { day: 30 }]);
    expect(out).toEqual([{ day: 1 }, { day: 3 }, { day: 16.5, avg: null }, { day: 30 }]);
  });
});
