// Nutrition labels, units and arithmetic shared by the Nutrition page, workout fueling, Calendar and Fitness.

import type { Food, Meal, NutrientKey, Nutrients } from "@/api";

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
