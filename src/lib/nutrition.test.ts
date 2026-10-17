import type { Nutrients } from "@/api";

import { amount, bottleTotals, clockOffset, fromKg, glucoseFructose, recipeSummary, scaled, toKg } from "./nutrition";

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

describe("drinks and weights", () => {
  const recipe = { water_ml: 750, salt_g: 1.5, maltodextrin_g: 60, sucrose_g: 30, other: [{ name: "Caffeine powder", caffeine_mg: 100 }] };

  it("adds up bottles like the API", () => {
    expect(bottleTotals(recipe, 2)).toEqual({
      fluid_ml: 1500,
      carbs_g: 180,
      sodium_mg: 2 * 1.5 * 393.4,
      caffeine_mg: 200,
      kcal: 720,
      glucose_g: 150,
      fructose_g: 30,
    });
  });

  it("describes a bottle and its sugars", () => {
    expect(recipeSummary(recipe)).toBe("750 ml · 60 g maltodextrin · 30 g sucrose · 1.5 g salt · caffeine powder");
    expect(glucoseFructose(75, 60)).toBe("1 : 0.8");
    expect(glucoseFructose(150, 3)).toBe("1 : 0.02");
    expect(glucoseFructose(0, 10)).toBeNull();
  });

  it("converts pounds", () => {
    expect(toKg(160, "lb")).toBeCloseTo(72.57, 2);
    expect(fromKg(72.57, "lb")).toBeCloseTo(160, 1);
    expect(toKg(70, "kg")).toBe(70);
  });
});
