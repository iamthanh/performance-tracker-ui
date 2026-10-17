import type { NutritionDay } from "@/api";

/** A day on the energy chart: kcal eaten (null when nothing was logged) and burned. */
export type EnergyPoint = {
  date: string;
  eaten: number | null;
  burned: number | null;
  workouts: number | null;
  balance: number | null;
};

/** One point per day of the range, so the chart lines up with the charts above it; none without any data. */
export function energyPoints(days: NutritionDay[]): EnergyPoint[] {
  const points = days.map((d) => ({
    date: d.date,
    eaten: d.entries ? d.intake.kcal : null,
    burned: d.total_kcal,
    workouts: d.workout_kcal,
    balance: d.balance_kcal,
  }));
  return points.some((p) => p.eaten !== null || p.burned !== null) ? points : [];
}
