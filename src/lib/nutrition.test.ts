import type { Nutrients } from "@/api";

import { amount, clockOffset, scaled } from "./nutrition";

const gel = { kcal: 100, carbs_g: 25, fat_g: null } as unknown as Nutrients;

describe("nutrition helpers", () => {
  it("scales a serving, keeping unknowns unknown", () => {
    expect(scaled(gel, 2)).toMatchObject({ kcal: 200, carbs_g: 50, fat_g: null });
  });

  it("formats amounts and times into a workout", () => {
    expect(amount(25, "g")).toBe("25 g");
    expect(amount(null, "g")).toBe("—");
    expect(clockOffset(3900)).toBe("1:05");
    expect(clockOffset(null)).toBe("—");
  });
});
