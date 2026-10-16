import { COMPARE_PRESETS, rangeLabel } from "./ranges";

describe("power-curve ranges", () => {
  it("leaves out 6 weeks", () => {
    expect(COMPARE_PRESETS.map((p) => p.id)).not.toContain("42d");
  });

  it("labels ranges", () => {
    expect(rangeLabel("90d")).toBe("Last 90 days");
    expect(rangeLabel("all")).toBe("All time");
    expect(rangeLabel("none")).toBe("");
  });
});
