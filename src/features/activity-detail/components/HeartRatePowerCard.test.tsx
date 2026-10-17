import { render, screen } from "@testing-library/react";

import type { RideCardio } from "@/api";

import { HeartRatePowerCard } from "./HeartRatePowerCard";

const MODEL: NonNullable<RideCardio["model"]> = {
  reference: { power_w: 185, hr_bpm: 146, power_auto: true, hr_auto: true },
  slope_bpm_per_w: 0.25,
  drift_bpm_per_1000kj: 5,
  corrections: { indoor_bpm: -5, heat_bpm_per_c: 0.6, heat_from_c: 25, form_bpm_per_tsb: 0.17 },
  fitted: { slope: true, indoor: true, heat: true, form: true, recovery: true },
  rides: 100,
  blocks: 900,
  outliers: 0,
};

it("sets the ride against its recent normal", () => {
  const data: RideCardio = {
    model: MODEL,
    blocks: [
      { start_s: 600, clock_s: 600, watts: 180, bpm: 140, temp_c: 28, kj_before: 100, used: false, warm_up: true },
      { start_s: 1500, clock_s: 1560, watts: 185, bpm: 153, temp_c: 28, kj_before: 260, used: true, warm_up: false },
    ],
    ride: {
      source: "strava", source_id: "1", name: "Ride", date: "2026-10-16", indoor: false, temp_c: 28, tsb: 5.7, blocks: 2,
      raw_bpm: 156.4, outlier: false, bpm: 153.6, power_w: 154, corrections: { indoor: 0, heat: 1.8, form: 1 }, recovery_bpm: 18.7, drift: null,
    },
    normal: { bpm: 150.6, power_w: 166, rides: 14, bpm_at_conditions: 153.4, difference_bpm: 3 },
    recoveries: [{ peak_bpm: 165, drop_bpm: 19, effort_w: 300, recovery_w: 40, counts: true }],
  };
  render(<HeartRatePowerCard data={data} />);
  expect(screen.getByText("153.6")).toBeInTheDocument();
  expect(screen.getByText(/156.4 as ridden; heat \+1.8 bpm \(28 °C\), fresh \+1.0 bpm \(TSB \+6\)/)).toBeInTheDocument();
  expect(screen.getByText("+3.0")).toBeInTheDocument();
  expect(screen.getByText("harder than usual (≈ −12 W at 146 bpm)")).toBeInTheDocument();
  expect(screen.getByText(/19 bpm from 165/)).toBeInTheDocument();
});

it("says when the whole ride is left out as a sensor problem", () => {
  const data: RideCardio = {
    model: MODEL,
    blocks: [{ start_s: 1500, clock_s: 1500, watts: 185, bpm: 61, temp_c: null, kj_before: 260, used: true, warm_up: false }],
    ride: {
      source: "strava", source_id: "2", name: "Ride", date: "2024-11-22", indoor: true, temp_c: null, tsb: -6, blocks: 1,
      raw_bpm: 61.4, outlier: true, bpm: null, power_w: null, corrections: { indoor: -4.7, heat: 0, form: -1 }, recovery_bpm: null, drift: null,
    },
    normal: { bpm: 142, power_w: 200, rides: 12, bpm_at_conditions: 136, difference_bpm: null },
    recoveries: [],
  };
  render(<HeartRatePowerCard data={data} />);
  expect(screen.getByText(/likely a heart-rate sensor problem \(left out\)/)).toBeInTheDocument();
});
