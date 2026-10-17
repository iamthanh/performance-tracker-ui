import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Cardio, CardioDay } from "@/api";
import { mockApi } from "@/test/utils";

import { CardioSection } from "./CardioSection";

const MODEL: NonNullable<Cardio["model"]> = {
  reference: { power_w: 185, hr_bpm: 146, power_auto: true, hr_auto: true },
  slope_bpm_per_w: 0.25,
  drift_bpm_per_1000kj: 5.2,
  corrections: { indoor_bpm: -5.3, heat_bpm_per_c: 0.61, heat_from_c: 25, form_bpm_per_tsb: 0.17 },
  fitted: { slope: true, indoor: true, heat: true, form: true, recovery: false },
  rides: 1163,
  blocks: 10499,
  outliers: 1,
};

const day = (date: string, hr: number): CardioDay => ({
  date,
  score: 100 + (150 - hr),
  hr_at_ref: hr,
  power_at_ref: 185 + (146 - hr) / 0.25,
  rides: 12,
  tsb: -5,
  vo2max: 48.2,
  vo2max_basis: { resting: "assumed", resting_hr: 50, max_hr: 180, kg: 73, weight_kind: "weigh_in" },
  components: {
    aerobic: { value: 185 + (146 - hr) / 0.25, index: 100 + (150 - hr) },
    resting_hr: { value: null, index: null },
    hr_recovery: { value: 23, index: 101 },
    drift: { value: 4.4, index: null },
  },
});

function cardio(): Cardio {
  return {
    weights: { aerobic: 60, resting_hr: 25, hr_recovery: 15 },
    settings: { reference_power_w: null, reference_hr_bpm: null, weights: { aerobic: 60, resting_hr: 25, hr_recovery: 15 } },
    window_days: 42,
    components: [
      { key: "aerobic", label: "Aerobic efficiency", description: "Power at your reference heart rate", unit: "W", scored: true, lower_is_better: false, baseline: 179 },
      { key: "resting_hr", label: "Resting heart rate", description: "Median daily resting heart rate", unit: "bpm", scored: true, lower_is_better: true, baseline: null },
      { key: "hr_recovery", label: "HR recovery", description: "Drop after a hard effort", unit: "bpm", scored: true, lower_is_better: false, baseline: 22 },
      { key: "drift", label: "Cardiac drift", description: "Rise per 1000 kJ", unit: "bpm/1000 kJ", scored: false, lower_is_better: true, baseline: 3.8 },
    ],
    model: MODEL,
    days: [day("2026-10-01", 152), day("2026-10-02", 151), day("2026-10-03", 150.8)],
    rides: [
      {
        source: "strava", source_id: "9", name: "Hot one", date: "2026-10-03", indoor: false, temp_c: 31, tsb: -22, blocks: 6,
        raw_bpm: 151, outlier: false, bpm: 150.1, power_w: 168, corrections: { indoor: 0, heat: 3.7, form: -3.7 }, recovery_bpm: null, drift: null,
      },
    ],
  };
}

function renderSection() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <CardioSection range={{ start: "2026-10-01", end: "2026-10-03" }} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it("shows heart rate at the reference power, the corrections and each ride", async () => {
  mockApi({ "/cardio": () => cardio() });
  renderSection();
  expect((await screen.findAllByText("HR at 185 W")).length).toBeGreaterThan(0);
  expect(screen.getByText("150.8")).toBeInTheDocument();
  expect(screen.getByText("−1.2")).toBeInTheDocument(); // HR change in range
  expect(screen.getByText("HR at 185 W · fitter")).toBeInTheDocument();
  expect(screen.getByText(/1 ride was left out/)).toBeInTheDocument();
  expect(screen.getByText(/resting HR assumed 50/)).toBeInTheDocument();
  expect(screen.getByText(/No resting heart rate yet/)).toBeInTheDocument();
  expect(screen.getByText("heat +3.7 bpm (31 °C), tired −3.7 bpm (TSB −22)")).toBeInTheDocument();
  expect(screen.getByText(/1,163 rides/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Power" }));
  expect(screen.getByText("W at 146 bpm · fitter")).toBeInTheDocument();
});

it("explains an empty index", async () => {
  mockApi({ "/cardio": () => ({ ...cardio(), model: null, days: [], rides: [] }) });
  renderSection();
  expect(await screen.findByText("No cardio index yet")).toBeInTheDocument();
});
