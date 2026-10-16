import { projectRoute } from "./route";

describe("projectRoute", () => {
  it("needs two real points", () => {
    expect(projectRoute([0, 45], [0, 7])).toBeNull();
    expect(projectRoute([null, 45], [null, 7])).toBeNull();
  });

  it("fits the long side to 1000 units, north up", () => {
    const route = projectRoute([45, 45.01], [7, 7])!;
    expect(route.height).toBeCloseTo(1000);
    expect(route.start[1]).toBeCloseTo(1000);
    expect(route.end).toEqual([0, 0]);
    expect(route.d).toBe("M0.0,1000.0L0.0,0.0");
  });
});
