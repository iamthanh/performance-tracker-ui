import { useFueling, useNutritionMutations, type Fueling, type NutritionEntry } from "@/api";
import { Card, CardHeader, DataTable, EntryForm, ErrorState, StatTile } from "@/components";
import { num } from "@/lib/format";
import { clockOffset, MEAL_LABELS } from "@/lib/nutrition";

/** What the workout was fuelled with, per hour, against what it burned; log more below. */
export function FuelingCard({ source, sourceId, date }: { source: string; sourceId: string; date: string }) {
  const fueling = useFueling(source, sourceId);
  return (
    <Card label="Fueling">
      <CardHeader
        title="Fueling"
        subtitle="Carbs, fluid, sodium and caffeine taken during the workout, per hour of moving time"
      />
      {fueling.isError ? <ErrorState error={fueling.error} /> : fueling.data ? <FuelingSummary fueling={fueling.data} /> : null}
      <EntryForm date={date} meal="during_workout" activity={{ source, source_id: sourceId }} />
      {fueling.data?.entries.length ? (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <FuelingTable entries={fueling.data.entries} />
        </div>
      ) : null}
    </Card>
  );
}

function FuelingSummary({ fueling: f }: { fueling: Fueling }) {
  const burnedPerHour = f.carbs_burned_g_per_h_estimate;
  return (
    <div className="tiles" style={{ marginBottom: 12 }}>
      <StatTile
        hero
        label="Carbs"
        value={num(f.per_hour.carbs_g)}
        unit="g/h"
        hint={burnedPerHour ? `~${num(burnedPerHour)} g/h burned (estimate)` : undefined}
      />
      <StatTile label="Fluid" value={num(f.per_hour.fluid_ml)} unit="ml/h" />
      <StatTile label="Sodium" value={num(f.per_hour.sodium_mg)} unit="mg/h" />
      <StatTile label="Caffeine" value={num(f.during.caffeine_mg)} unit="mg" />
      <StatTile
        label="Energy taken"
        value={num(f.during.kcal)}
        unit="kcal"
        hint={f.burned_kcal ? `of ${num(f.burned_kcal)} kcal burned` : undefined}
      />
    </div>
  );
}

function FuelingTable({ entries }: { entries: NutritionEntry[] }) {
  const { deleteEntry } = useNutritionMutations();
  return (
    <>
      {deleteEntry.isError ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {(deleteEntry.error as Error).message}
        </p>
      ) : null}
      <DataTable
        rows={entries}
        rowKey={(e) => e.id}
        columns={[
          { key: "when", header: "When", cell: (e) => (e.meal === "during_workout" ? clockOffset(e.offset_s) : MEAL_LABELS[e.meal]) },
          { key: "name", header: "Item", headerClassName: "left", cellClassName: "left", cell: (e) => e.name },
          { key: "servings", header: "Servings", cell: (e) => num(e.servings, Number.isInteger(e.servings) ? 0 : 1) },
          { key: "carbs", header: "Carbs (g)", cell: (e) => num(e.carbs_g) },
          { key: "fluid", header: "Fluid (ml)", cell: (e) => num(e.fluid_ml) },
          { key: "sodium", header: "Sodium (mg)", cell: (e) => num(e.sodium_mg) },
          { key: "caffeine", header: "Caffeine (mg)", cell: (e) => num(e.caffeine_mg) },
          { key: "kcal", header: "kcal", cell: (e) => num(e.kcal) },
          {
            key: "remove",
            header: null,
            cell: (e) => (
              <button
                type="button"
                className="btn ghost small"
                disabled={deleteEntry.isPending}
                aria-label={`Remove ${e.name}`}
                onClick={() => window.confirm(`Remove ${e.name}?`) && deleteEntry.mutate(e.id)}
              >
                Remove
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
