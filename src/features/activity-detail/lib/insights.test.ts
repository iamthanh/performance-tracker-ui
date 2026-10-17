import type { Durability } from "@/api";

import { durabilityChart, durabilityRows, perKg, stepLabel, stepTicks, timeTicks, weightNote, worstFade, wPerKg } from "./insights";

const D: Durability = {
  unit: "kJ",
  steps: [0, 100, 200],
  total: 245,
  rows: [
    { duration_s: 60, watts: [400, 380, 360] },
    { duration_s: 1200, watts: [280, 245, null] },
  ],
};

describe("ride insights", () => {
  it("divides by body weight only when there is one", () => {
    expect(perKg(350, 70)).toBe(5);
    expect(perKg(350, null)).toBeNull();
    expect(perKg(null, 70)).toBeNull();
    expect(wPerKg(245, 70)).toBe("3.50 W/kg");
    expect(wPerKg(245, 0)).toBe("—");
  });

  it("says where the weight comes from", () => {
    expect(weightNote({ kg: 70.71, origin: "body", date: "2020-03-10", count: 7 })).toMatch(/^70\.7 kg, average of 7 weigh-ins to /);
    expect(weightNote({ kg: 70, origin: "body", date: "2020-03-10", count: 1 })).toMatch(/^70\.0 kg, weigh-in of /);
    expect(weightNote({ kg: 68.4, origin: "pre_workout", date: "2020-03-10" })).toBe("68.4 kg, weighed before the ride");
  });

  it("labels steps", () => {
    expect(stepLabel(0, "kJ")).toBe("From the start");
    expect(stepLabel(2000, "kJ")).toBe("After 2,000 kJ");
    expect(stepLabel(700, "kJ", 70)).toBe("After 700 kJ (10.0 kJ/kg)");
    expect(stepLabel(0, "kJ", 70)).toBe("From the start");
  });

  it("spaces chart ticks so there are at most about ten", () => {
    expect(stepTicks(900)).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
    expect(stepTicks(1300)).toEqual([0, 200, 400, 600, 800, 1000, 1200]);
    expect(stepTicks(4400)).toEqual([0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]);
  });

  it("shows each step as a share of the from-the-start best", () => {
    const rows = durabilityRows(D);
    expect(rows[0]!.cells.map((c) => c.ofFresh)).toEqual([100, 95, 90]);
    expect(rows[1]!.cells[2]).toEqual({ watts: null, ofFresh: null });
    expect(durabilityChart(D)).toEqual([
      { step: 0, d60: 100, d1200: 100 },
      { step: 100, d60: 95, d1200: 87.5 },
      { step: 200, d60: 90, d1200: null },
    ]);
  });

  it("finds the biggest fade at each duration's last step", () => {
    expect(worstFade(D)).toEqual({ duration_s: 1200, ofFresh: 87.5, step: 100 });
    expect(worstFade({ ...D, steps: [0], rows: [{ duration_s: 60, watts: [300] }] })).toBeNull();
  });

  it("places time ticks on the kJ axis, skipping the ones a stop would crowd", () => {
    const marks = [
      { time_s: 1800, kj: 360 },
      { time_s: 3600, kj: 365 }, // a café stop: half an hour, 5 kJ
      { time_s: 5400, kj: 540 },
      { time_s: 7200, kj: 720 },
    ];
    expect(timeTicks(marks, 600)).toEqual([
      { kj: 360, time_s: 1800 },
      { kj: 540, time_s: 5400 },
    ]);
  });
});
