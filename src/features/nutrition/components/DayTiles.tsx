import type { NutritionDay } from "@/api";
import { StatTile } from "@/components";
import { num, signed } from "@/lib/format";

/** The day's energy in and out, and its macronutrients. */
export function DayTiles({ day }: { day: NutritionDay | undefined }) {
  const intake = day?.intake;
  return (
    <div className="tiles">
      <StatTile hero label="Eaten" value={num(intake?.kcal)} unit="kcal" hint={day?.entries ? `${day.entries} items` : "Nothing logged"} />
      <StatTile
        label="Burned"
        value={num(day?.total_kcal)}
        unit="kcal"
        hint={day?.total_kcal ? (day.partial ? "So far today" : undefined) : "From your watch, once synced"}
      />
      <StatTile
        label="Balance"
        value={day?.partial || day?.balance_kcal === null || day?.balance_kcal === undefined ? "—" : signed(day.balance_kcal, 0)}
        unit="kcal"
        hint={day?.partial ? "Once the day is over" : undefined}
      />
      <StatTile label="Workouts" value={num(day?.workout_kcal)} unit="kcal" />
      <StatTile label="Carbs" value={num(intake?.carbs_g)} unit="g" />
      <StatTile label="Protein" value={num(intake?.protein_g)} unit="g" />
      <StatTile label="Fat" value={num(intake?.fat_g)} unit="g" />
    </div>
  );
}
