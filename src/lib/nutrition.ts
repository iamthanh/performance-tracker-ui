// Nutrition labels, units and arithmetic shared by the Nutrition page, workout fueling, Calendar and Fitness.

import type { DrinkRecipe, Food, Meal, NutrientKey, Nutrients } from "@/api";

import { num } from "./format";

export type NutrientInfo = { key: NutrientKey; label: string; unit: string; digits: number };

/** The nutrients the forms ask for, in display order (the API also stores sugars, fibre and potassium). */
export const FORM_NUTRIENTS: NutrientInfo[] = [
  { key: "kcal", label: "Energy", unit: "kcal", digits: 0 },
  { key: "carbs_g", label: "Carbs", unit: "g", digits: 0 },
  { key: "protein_g", label: "Protein", unit: "g", digits: 0 },
  { key: "fat_g", label: "Fat", unit: "g", digits: 0 },
  { key: "fluid_ml", label: "Fluid", unit: "ml", digits: 0 },
  { key: "sodium_mg", label: "Sodium", unit: "mg", digits: 0 },
  { key: "caffeine_mg", label: "Caffeine", unit: "mg", digits: 0 },
];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Before a workout",
  during_workout: "During a workout",
  post_workout: "After a workout",
};

/** "25 g", "—" when unknown. */
export function amount(value: number | null | undefined, unit: string, digits = 0): string {
  return value === null || value === undefined ? "—" : `${num(value, digits)} ${unit}`;
}

/** A food's nutrients for `servings` servings (unknown stays unknown). */
export function scaled(food: Nutrients, servings: number): Nutrients {
  return Object.fromEntries(
    Object.entries(food).map(([k, v]) => [k, v === null ? null : v * servings]),
  ) as Nutrients;
}

/** Only the nutrient fields of a food or entry. */
export function nutrientsOf(item: Nutrients): Nutrients {
  return {
    kcal: item.kcal,
    carbs_g: item.carbs_g,
    sugars_g: item.sugars_g,
    protein_g: item.protein_g,
    fat_g: item.fat_g,
    fiber_g: item.fiber_g,
    sodium_mg: item.sodium_mg,
    potassium_mg: item.potassium_mg,
    caffeine_mg: item.caffeine_mg,
    fluid_ml: item.fluid_ml,
  };
}

/** "Maurten Gel 100 · 1 gel (40 g)" for pickers. */
export function foodLabel(food: Food): string {
  return [food.brand ? `${food.brand} ${food.name}` : food.name, food.serving].filter(Boolean).join(" · ");
}

/** "1:05" into a workout from seconds. */
export function clockOffset(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.round(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

// -- drinks ---------------------------------------------------------------------------------------

/** Table salt is 39.3 % sodium (the API uses the same figure). */
export const SODIUM_MG_PER_G_SALT = 393.4;

/** What `bottles` bottles of `recipe` add up to; mirrors the API's arithmetic, for the form's preview. */
export function bottleTotals(recipe: DrinkRecipe, bottles: number) {
  const sum = (...xs: (number | null | undefined)[]) => xs.reduce<number>((t, x) => t + (x ?? 0), 0);
  const carbs = sum(recipe.maltodextrin_g, recipe.sucrose_g, ...recipe.other.map((o) => o.carbs_g));
  const glucose = sum(recipe.maltodextrin_g) + sum(recipe.sucrose_g) / 2;
  const fructose = sum(recipe.sucrose_g) / 2;
  return {
    fluid_ml: sum(recipe.water_ml) * bottles,
    carbs_g: carbs * bottles,
    sodium_mg: (sum(recipe.salt_g) * SODIUM_MG_PER_G_SALT + sum(...recipe.other.map((o) => o.sodium_mg))) * bottles,
    caffeine_mg: sum(...recipe.other.map((o) => o.caffeine_mg)) * bottles,
    kcal: carbs * 4 * bottles,
    glucose_g: glucose * bottles,
    fructose_g: fructose * bottles,
  };
}

/** "1 : 0.8", glucose to fructose; null without glucose. */
export function glucoseFructose(glucose: number, fructose: number): string | null {
  return glucose > 0 ? `1 : ${(fructose / glucose).toFixed(fructose / glucose < 0.1 ? 2 : 1)}` : null;
}

/** "750 ml · 60 g maltodextrin · 30 g sucrose · 1.5 g salt · caffeine powder": one bottle. */
export function recipeSummary(recipe: DrinkRecipe): string {
  const parts = [
    recipe.water_ml ? `${num(recipe.water_ml)} ml` : null,
    recipe.maltodextrin_g ? `${num(recipe.maltodextrin_g)} g maltodextrin` : null,
    recipe.sucrose_g ? `${num(recipe.sucrose_g)} g sucrose` : null,
    recipe.salt_g ? `${num(recipe.salt_g, recipe.salt_g % 1 ? 1 : 0)} g salt` : null,
    ...recipe.other.map((o) => o.name.toLowerCase()),
  ];
  return parts.filter(Boolean).join(" · ");
}

// -- body weight -----------------------------------------------------------------------------------

export type WeightUnit = "kg" | "lb";
export const KG_PER_LB = 0.45359237;

export const toKg = (value: number, unit: WeightUnit) => (unit === "kg" ? value : value * KG_PER_LB);
export const fromKg = (kg: number, unit: WeightUnit) => (unit === "kg" ? kg : kg / KG_PER_LB);

const WEIGHT_UNIT_KEY = "pt-weight-unit";

/** The weight unit picked last in this browser (kg unless lb was chosen). */
export function storedWeightUnit(): WeightUnit {
  try {
    return localStorage.getItem(WEIGHT_UNIT_KEY) === "lb" ? "lb" : "kg";
  } catch {
    return "kg";
  }
}

export function saveWeightUnit(unit: WeightUnit): void {
  try {
    localStorage.setItem(WEIGHT_UNIT_KEY, unit);
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
}
