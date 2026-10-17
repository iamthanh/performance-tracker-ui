import { useState } from "react";

import { useFueling, useNutritionMutations, type Fueling, type NutritionEntry } from "@/api";
import { Card, CardHeader, DataTable, DrinkForm, EntryForm, ErrorState, Segmented, StatTile } from "@/components";
import { num, signed } from "@/lib/format";
import { clockOffset, fromKg, glucoseFructose, MEAL_LABELS, recipeSummary, storedWeightUnit, type WeightUnit } from "@/lib/nutrition";

import { WeightForm } from "./WeightForm";

/** What the workout was fuelled with, per hour, against what it burned; body weight and sweat rate; log more. */
export function FuelingCard({ source, sourceId, date }: { source: string; sourceId: string; date: string }) {
  const fueling = useFueling(source, sourceId);
  const [mode, setMode] = useState<"drink" | "food">("drink");
  const [unit, setUnit] = useState<WeightUnit>(storedWeightUnit);
  return (
    <Card label="Fueling">
      <CardHeader
        title="Fueling"
        subtitle="Carbs, fluid, sodium and caffeine taken during the workout, per hour of moving time"
      />
      {fueling.isError ? <ErrorState error={fueling.error} /> : fueling.data ? <FuelingSummary fueling={fueling.data} unit={unit} /> : null}
      <div className="filters" style={{ marginBottom: 8 }}>
        <Segmented
          label="Log"
          value={mode}
          onChange={setMode}
          options={[
            { value: "drink", label: "Drink (bottles)" },
            { value: "food", label: "Food" },
          ]}
        />
      </div>
      {mode === "drink" ? (
        <DrinkForm date={date} activity={{ source, source_id: sourceId }} />
      ) : (
        <EntryForm date={date} meal="during_workout" activity={{ source, source_id: sourceId }} />
      )}
      {fueling.data?.entries.length ? (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <FuelingTable entries={fueling.data.entries} />
        </div>
      ) : null}
      <h3 style={{ margin: "16px 0 8px" }}>Body weight</h3>
      <p className="small muted" style={{ margin: "0 0 8px" }}>
        Weigh yourself just before and just after (dry, same clothes) for your weight change and sweat rate.
      </p>
      {fueling.data ? (
        <WeightForm source={source} sourceId={sourceId} weight={fueling.data.weight} unit={unit} onUnit={setUnit} />
      ) : null}
    </Card>
  );
}

function FuelingSummary({ fueling: f, unit }: { fueling: Fueling; unit: WeightUnit }) {
  const burnedPerHour = f.carbs_burned_g_per_h_estimate;
  const ratio = f.drinks ? glucoseFructose(f.drinks.glucose_g, f.drinks.fructose_g) : null;
  const s = f.sweat;
  return (
    <div className="tiles" style={{ marginBottom: 12 }}>
      <StatTile
        hero
        label="Carbs"
        value={num(f.per_hour.carbs_g)}
        unit="g/h"
        hint={burnedPerHour ? `~${num(burnedPerHour)} g/h burned (estimate)` : undefined}
      />
      <StatTile label="Fluid" value={num(f.per_hour.fluid_ml)} unit="ml/h" hint={f.drinks ? `${num(f.drinks.bottles, f.drinks.bottles % 1 ? 1 : 0)} ${f.drinks.bottles === 1 ? "bottle" : "bottles"}` : undefined} />
      <StatTile label="Sodium" value={num(f.per_hour.sodium_mg)} unit="mg/h" />
      <StatTile label="Caffeine" value={num(f.during.caffeine_mg)} unit="mg" />
      <StatTile
        label="Energy taken"
        value={num(f.during.kcal)}
        unit="kcal"
        hint={f.burned_kcal ? `of ${num(f.burned_kcal)} kcal burned` : undefined}
      />
      {ratio ? <StatTile label="Glucose : fructose" value={ratio} hint="Maltodextrin and sucrose in the bottles" /> : null}
      {s ? (
        <>
          <StatTile
            label="Weight change"
            value={signed(fromKg(s.change_kg, unit), 1)}
            unit={unit}
            hint={`${signed(s.change_pct, 1)}% of body weight`}
          />
          <StatTile
            label="Sweat rate"
            value={num(s.sweat_l_per_h, 2)}
            unit="L/h"
            hint={`${num(fromKg(Math.abs(s.change_kg), unit), 1)} ${unit} ${s.change_kg > 0 ? "gained" : "lost"} + ${num(f.during.fluid_ml ?? 0)} ml drunk`}
          />
        </>
      ) : null}
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
          {
            key: "name",
            header: "Item",
            headerClassName: "left",
            cellClassName: "left",
            cell: (e) =>
              e.kind === "drink" && e.recipe ? (
                <>
                  {e.name} <span className="muted small">({recipeSummary(e.recipe)})</span>
                </>
              ) : (
                e.name
              ),
          },
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
