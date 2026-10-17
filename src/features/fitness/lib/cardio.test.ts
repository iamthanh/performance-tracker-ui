import type { CardioDay, CardioRide } from "@/api";

import { cardioDays, cardioPoints, fitness } from "./cardio";

const day = (date: string, hr: number | null, score: number | null = null): CardioDay => ({
  date,
  score,
  hr_at_ref: hr,
  power_at_ref: hr === null ? null : 185 + (146 - hr) / 0.25,
  rides: 6,
  tsb: 0,
  vo2max: null,
  vo2max_basis: null,
  components: {
    aerobic: { value: null, index: null },
    resting_hr: { value: null, index: null },
    hr_recovery: { value: null, index: null },
    drift: { value: null, index: null },
  },
});

const ride = (date: string, bpm: number, extra: Partial<CardioRide> = {}): CardioRide => ({
  source: "strava",
  source_id: date,
  name: "Ride",
  date,
  indoor: false,
  temp_c: 20,
  tsb: 0,
  blocks: 4,
  raw_bpm: bpm,
  outlier: false,
  bpm,
  power_w: 185 + (146 - bpm) / 0.25,
  corrections: { indoor: 0, heat: 0, form: 0 },
  recovery_bpm: null,
  drift: null,
  ...extra,
});

it("starts the range at the first day with a value", () => {
  const days = [day("2026-01-01", null), day("2026-01-02", 150), day("2026-01-03", null)];
  expect(cardioDays(days).map((d) => d.date)).toEqual(["2026-01-02", "2026-01-03"]);
  expect(cardioDays([day("2026-01-01", null)])).toEqual([]);
});

it("puts the day's rides as one dot next to the window's line", () => {
  const days = [day("2026-01-01", 150), day("2026-01-02", 149)];
  const points = cardioPoints(days, [ride("2026-01-02", 148), ride("2026-01-02", 146)], "hr");
  expect(points.map((p) => [p.value, p.ride])).toEqual([
    [150, null],
    [149, 147],
  ]);
  expect(cardioPoints(days, [ride("2026-01-02", 146)], "power")[1]!.ride).toBe(185);
  expect(cardioPoints(days, [ride("2026-01-02", 146)], "score")[1]!.ride).toBeNull(); // no dots on the score
  // A ride before the line starts still gets its dot.
  const early = cardioPoints(days, [ride("2025-12-30", 150)], "hr");
  expect(early.map((p) => [p.date, p.value, p.ride])).toEqual([["2025-12-30", null, 150], ["2026-01-01", 150, null], ["2026-01-02", 149, null]]);
});

it("says which way is fitter", () => {
  expect(fitness(-2, "hr")).toBe("fitter"); // fewer beats
  expect(fitness(2, "hr")).toBe("less fit");
  expect(fitness(5, "power")).toBe("fitter");
  expect(fitness(0.3, "power", 0)).toBeNull(); // shows as +0
  expect(fitness(0.3, "hr", 1)).toBe("less fit");
});
