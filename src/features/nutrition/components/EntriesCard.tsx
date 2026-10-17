import { MEALS, useNutritionMutations, type NutritionEntry } from "@/api";
import { Card, CardHeader, DataTable, Empty, EntryForm } from "@/components";
import { formatFullDay } from "@/lib/dates";
import { num } from "@/lib/format";
import { MEAL_LABELS } from "@/lib/nutrition";

/** Log food and drink for the day, and what is logged so far. */
export function EntriesCard({ day, entries }: { day: string; entries: NutritionEntry[] }) {
  const { deleteEntry } = useNutritionMutations();
  return (
    <Card label="Food and drink">
      <CardHeader
        title={`Food and drink · ${formatFullDay(day)}`}
        subtitle="Pick a saved food, or type in what you had. Fueling during a workout is easiest to log on the workout's page."
      />
      <EntryForm date={day} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        {entries.length ? (
          <DataTable
            rows={[...entries].sort((a, b) => MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal))}
            rowKey={(e) => e.id}
            columns={[
              { key: "meal", header: "Meal", cell: (e) => MEAL_LABELS[e.meal] },
              { key: "name", header: "Item", headerClassName: "left", cellClassName: "left", cell: (e) => e.name },
              { key: "servings", header: "Servings", cell: (e) => num(e.servings, Number.isInteger(e.servings) ? 0 : 1) },
              { key: "kcal", header: "kcal", cell: (e) => num(e.kcal) },
              { key: "carbs", header: "Carbs (g)", cell: (e) => num(e.carbs_g) },
              { key: "protein", header: "Protein (g)", cell: (e) => num(e.protein_g) },
              { key: "fat", header: "Fat (g)", cell: (e) => num(e.fat_g) },
              {
                key: "remove",
                header: null,
                cell: (e) => (
                  <button
                    type="button"
                    className="btn ghost small"
                    disabled={deleteEntry.isPending}
                    onClick={() => window.confirm(`Remove ${e.name}?`) && deleteEntry.mutate(e.id)}
                  >
                    Remove
                  </button>
                ),
              },
            ]}
          />
        ) : (
          <Empty title="Nothing logged for this day" />
        )}
      </div>
    </Card>
  );
}
