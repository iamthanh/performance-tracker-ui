import type { LoadDay, ThresholdValue } from "../api/types";
import { addDays, addMonths, daysBetween, monthEnd, presetRange, RANGE_PRESETS, today, weekStart } from "./dates";
import { compact, duration, durationLabel, hoursMinutes, num, signed, sportLabel } from "./format";
import { formStatus, rampRate, thresholdHistory, thresholdOn, trimLeadingEmpty } from "./training";

describe("dates", () => {
  it("does calendar arithmetic without DST drift", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09"); // across the US DST change
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });

  it("clamps month arithmetic to the month's last day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-15", -3)).toBe("2025-12-15");
    expect(monthEnd("2024-02-10")).toBe("2024-02-29");
  });

  it("starts weeks on Monday, like the API", () => {
    expect(weekStart("2026-10-14")).toBe("2026-10-12"); // a Wednesday
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // Sunday belongs to the week before
  });

  it("builds preset ranges ending on the given day, inclusive", () => {
    const ninety = RANGE_PRESETS.find((p) => p.id === "90d")!;
    expect(presetRange(ninety, "2026-10-14")).toEqual({ start: "2026-07-17", end: "2026-10-14" });
    const all = RANGE_PRESETS.find((p) => p.all)!;
    expect(presetRange(all, "2026-10-14").start).toBe("2000-01-01");
  });

  it("uses the local calendar day for today", () => {
    expect(today(new Date(2026, 9, 14, 23, 59))).toBe("2026-10-14");
    expect(today(new Date(2026, 9, 14, 0, 1))).toBe("2026-10-14");
  });
});

describe("format", () => {
  it("formats durations", () => {
    expect(duration(7649)).toBe("2:07:29");
    expect(duration(59)).toBe("0:59");
    expect(duration(null)).toBe("—");
    expect(hoursMinutes(7649)).toBe("2h 07m");
    expect(hoursMinutes(1500)).toBe("25m");
    expect(durationLabel(1)).toBe("1s");
    expect(durationLabel(300)).toBe("5m");
    expect(durationLabel(5400)).toBe("1h30");
    expect(durationLabel(3600)).toBe("1h");
  });

  it("formats numbers, signs and missing values", () => {
    expect(num(1234.567, 1)).toMatch(/1.?234\.6/);
    expect(num(Number.NaN)).toBe("—");
    expect(num(undefined)).toBe("—");
    expect(signed(2.54)).toBe("+2.5");
    expect(signed(-2.54)).toBe("−2.5");
    expect(signed(0)).toBe("0.0");
    expect(compact(12900)).toMatch(/12\.9K/);
  });

  it("labels sports", () => {
    expect(sportLabel("cycling")).toBe("Ride");
    expect(sportLabel("indoor_rowing")).toBe("Indoor rowing");
    expect(sportLabel(null)).toBe("Other");
  });
});

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
