import type { CardioRide } from "@/api";

import { bpmAsWatts, correctionParts } from "./cardio";

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

it("describes the corrections a ride got", () => {
  const r = ride("2026-07-01", 150, { temp_c: 31.4, tsb: -22, corrections: { indoor: 0, heat: 3.8, form: -3.7 } });
  expect(correctionParts(r)).toEqual(["heat +3.8 bpm (31 °C)", "tired −3.7 bpm (TSB −22)"]);
  expect(correctionParts(ride("2026-01-01", 150, { indoor: true, corrections: { indoor: -5.3, heat: 0, form: 0 } }))).toEqual([
    "indoors −5.3 bpm",
  ]);
});

it("turns beats into watts along the slope", () => {
  expect(bpmAsWatts(-3, { slope_bpm_per_w: 0.25 })).toBe(12);
});
