import { addDays, addMonths, daysBetween, formatShortMonth, monthEnd, presetRange, RANGE_PRESETS, today, weekStart } from "./dates";

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

  it("labels months with their year", () => {
    expect(formatShortMonth("2026-10-01")).toMatch(/'26$/);
  });

  it("uses the local calendar day for today", () => {
    expect(today(new Date(2026, 9, 14, 23, 59))).toBe("2026-10-14");
    expect(today(new Date(2026, 9, 14, 0, 1))).toBe("2026-10-14");
  });
});
