import type { LoadDay, ThresholdValue } from "@/api/types";

import { addDays } from "./dates";
import { formStatus, rampRate, thresholdHistory, thresholdOn, trimLeadingEmpty } from "./training";

const day = (date: string, tss: number, ctl: number, atl = 0, unscored = 0): LoadDay => ({
  date,
  tss,
  ctl,
  atl,
  tsb: ctl - atl,
  unscored,
});

describe("training", () => {
  it("names form bands like TrainingPeaks", () => {
    expect(formStatus(30).label).toBe("Transition");
    expect(formStatus(10).label).toBe("Fresh");
    expect(formStatus(-2.6).label).toBe("Neutral");
    expect(formStatus(-20).label).toBe("Optimal training");
    expect(formStatus(-31).label).toBe("High risk");
  });

  it("computes the 7-day ramp rate and trims empty history", () => {
    const days = Array.from({ length: 10 }, (_, i) => day(addDays("2026-01-01", i), 50, 10 + i));
    expect(rampRate(days)).toBe(7);
    expect(rampRate(days.slice(0, 7))).toBeNull();
    const padded = [day("2025-12-30", 0, 0), day("2025-12-31", 0, 0), ...days];
    expect(trimLeadingEmpty(padded)[0]!.date).toBe("2026-01-01");
  });

  // Mirrors the backend's tests/test_analysis.py::test_timeline_manual_values_hold_until_beaten.
  const v = (effective_date: string, origin: "auto" | "manual", value: number): ThresholdValue => ({
    metric: "ftp_w",
    effective_date,
    origin,
    value,
    note: null,
  });
  const timeline = [
    v("2026-01-01", "auto", 200),
    v("2026-03-01", "auto", 210),
    v("2026-03-01", "manual", 250),
    v("2026-05-01", "auto", 205),
    v("2026-07-01", "auto", 260),
    v("2026-09-01", "auto", 240),
  ];

  it("resolves thresholds by the backend's rule", () => {
    expect(thresholdOn(timeline, "2025-06-01")).toBe(200);
    expect(thresholdOn(timeline, "2026-02-15")).toBe(200);
    expect(thresholdOn(timeline, "2026-03-01")).toBe(250);
    expect(thresholdOn(timeline, "2026-05-01")).toBe(250);
    expect(thresholdOn(timeline, "2026-07-01")).toBe(260);
    expect(thresholdOn(timeline, "2026-09-15")).toBe(240);
    expect(thresholdOn([], "2026-01-01")).toBeNull();
    // Before the first entry, a same-day tie goes to the lower value, as min((date, value)) does in the backend.
    const tie = [v("2026-03-01", "manual", 250), v("2026-03-01", "auto", 210)];
    expect(thresholdOn(tie, "2026-01-01")).toBe(210);
  });

  // Mirrors the backend's test_timeline_a_declining_auto_value_does_not_override_a_lower_manual_one.
  it("never lets a declining automatic value override a lower manual one", () => {
    const declining = [
      v("2025-06-01", "auto", 263),
      v("2026-01-05", "auto", 262),
      v("2026-01-10", "manual", 230),
      v("2026-01-12", "auto", 261),
      v("2026-02-20", "auto", 255),
      v("2026-03-01", "auto", 258),
    ];
    expect(thresholdOn(declining, "2026-01-12")).toBe(230);
    expect(thresholdOn(declining, "2026-02-20")).toBe(230);
    expect(thresholdOn(declining, "2026-03-01")).toBe(258);
  });

  it("marks each point of the history with the entry that set it", () => {
    // An auto value equal to an earlier manual value is still auto.
    const history = thresholdHistory([v("2026-01-01", "manual", 250), v("2026-02-01", "auto", 260), v("2026-04-01", "auto", 250)], "2026-04-01");
    expect(history.map((p) => p.origin)).toEqual(["manual", "auto", "auto"]);
  });

  it("builds the history of the value in effect", () => {
    expect(thresholdHistory(timeline, "2026-10-14")).toEqual([
      { date: "2026-01-01", value: 200, origin: "auto" },
      { date: "2026-03-01", value: 250, origin: "manual" },
      { date: "2026-07-01", value: 260, origin: "auto" },
      { date: "2026-09-01", value: 240, origin: "auto" },
      { date: "2026-10-14", value: 240, origin: "auto" },
    ]);
  });
});
