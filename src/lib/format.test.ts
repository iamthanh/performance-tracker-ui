import { compact, duration, durationLabel, elapsedLabel, hoursMinutes, num, signed, sportLabel } from "./format";

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
    expect(elapsedLabel(2700)).toBe("45m");
    expect(elapsedLabel(3900)).toBe("1:05");
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
