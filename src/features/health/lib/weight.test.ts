import type { WeightDay } from "@/api";

import { chartPoints, dayNumber, fromDayNumber, tableRows, weightStats } from "./weight";

const d = (date: string, kg: number, kind: WeightDay["kind"], weigh_in: number | null = null, gap = 0): WeightDay => ({
  date,
  kg,
  kind,
  weigh_in,
  weigh_ins: weigh_in === null ? 0 : 1,
  gap_days: gap,
  last_weigh_in: date,
});

const DAYS: WeightDay[] = [
  d("2020-01-01", 70, "weigh_in", 70.4),
  d("2020-01-02", 70.1, "interpolated", null, 3),
  d("2020-01-03", 70.2, "interpolated", null, 3),
  d("2020-01-04", 70.3, "weigh_in", 69.9),
  d("2020-01-05", 70.5, "estimated", null, 60),
  d("2020-03-04", 72, "weigh_in", 72),
];

describe("weight trend", () => {
  it("keeps raw weigh-ins apart from the trend, and draws guesses dashed", () => {
    // (The fixture skips Jan 6 - Mar 3, which adds a break point; leave it out here.)
    const points = chartPoints(DAYS, "kg").filter((p) => Number.isInteger(p.day));
    expect(points.map((p) => p.raw)).toEqual([70.4, null, null, 69.9, null, 72]);
    expect(points.map((p) => p.solid)).toEqual([70, 70.1, 70.2, 70.3, null, 72]);
    expect(points.map((p) => p.dashed)).toEqual([null, null, null, 70.3, 70.5, 72]); // joined at both ends
    expect(fromDayNumber(dayNumber("2020-03-04"))).toBe("2020-03-04");
  });

  it("breaks the lines where days have no value at all", () => {
    const points = chartPoints([d("2016-12-14", 78, "weigh_in", 78), d("2018-06-26", 79, "weigh_in", 79)], "kg");
    expect(points.map((p) => [p.solid, p.dashed, p.raw])).toEqual([
      [78, null, 78],
      [null, null, null],
      [79, null, 79],
    ]);
  });

  it("lists weigh-ins and collapses filled stretches in the table", () => {
    expect(tableRows(DAYS)).toEqual([
      { type: "weigh_in", date: "2020-01-01", raw: 70.4, trend: 70 },
      { type: "filled", kind: "interpolated", from: "2020-01-02", to: "2020-01-03", days: 2, gap: 3 },
      { type: "weigh_in", date: "2020-01-04", raw: 69.9, trend: 70.3 },
      { type: "filled", kind: "estimated", from: "2020-01-05", to: "2020-01-05", days: 1, gap: 60 },
      { type: "weigh_in", date: "2020-03-04", raw: 72, trend: 72 },
    ]);
  });

  it("counts each kind and keeps the latest raw weigh-in", () => {
    const stats = weightStats(DAYS, "kg")!;
    expect(stats).toMatchObject({ latestWeighIn: 72, latestWeighInDate: "2020-03-04", trend: 72, change: 2 });
    expect(stats.counts).toEqual({ weigh_in: 3, interpolated: 2, estimated: 1, carried: 0 });
    expect(weightStats([], "kg")).toBeNull();
  });
});
