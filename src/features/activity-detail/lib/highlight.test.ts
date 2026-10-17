import { visibleSpan } from "./highlight";

describe("marked stretch", () => {
  const rows = [{ t: 0 }, { t: 36000 }]; // a 10 h ride

  it("keeps a long stretch as it is", () => {
    expect(visibleSpan({ start_s: 600, end_s: 1800, label: "x" }, rows)).toEqual({ x1: 600, x2: 1800 });
  });

  it("widens a short one about its middle so it can be seen", () => {
    expect(visibleSpan({ start_s: 1000, end_s: 1030, label: "x" }, rows)).toEqual({ x1: 943, x2: 1087 });
  });
});
