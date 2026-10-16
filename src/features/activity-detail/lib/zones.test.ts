import { zoneRows } from "./zones";

describe("zoneRows", () => {
  it("labels ranges from the previous zone's top and computes shares", () => {
    const rows = zoneRows(
      [
        { zone: "Z1", upper: 130, seconds: 600 },
        { zone: "Z2", upper: 150, seconds: 1800 },
        { zone: "Z3", upper: null, seconds: 600 },
      ],
      "bpm",
    );
    expect(rows.map((r) => r.range)).toEqual(["0–130 bpm", "131–150 bpm", "151+ bpm"]);
    expect(rows.map((r) => r.share)).toEqual([20, 60, 20]);
  });

  it("does not divide by zero without time in zones", () => {
    expect(zoneRows([{ zone: "Z1", upper: 100, seconds: 0 }], "W")[0]!.share).toBe(0);
  });
});
