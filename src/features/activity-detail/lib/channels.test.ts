import { channelSpecs, streamRows } from "./channels";

describe("stream channels", () => {
  it("doubles cadence on foot", () => {
    expect(channelSpecs(true).find((c) => c.key === "cadence")).toMatchObject({ unit: "spm", scale: 2 });
    expect(channelSpecs(false).find((c) => c.key === "cadence")).toMatchObject({ unit: "rpm" });
  });

  it("scales samples to display units and keeps gaps", () => {
    const rows = streamRows({ time: [0, 1], speed: [10, null], cadence: [80, 81] }, channelSpecs(true));
    expect(rows[0]).toMatchObject({ t: 0, speed: 36, cadence: 160, power: null });
    expect(rows[1]).toMatchObject({ t: 1, speed: null, cadence: 162 });
  });
});
