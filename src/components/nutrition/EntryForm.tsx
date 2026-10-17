import { useState, type FormEvent } from "react";

import { MEALS, useFoods, useNutritionMutations, type EntryInput, type Meal } from "@/api";
import { FORM_NUTRIENTS, foodLabel, MEAL_LABELS, amount, scaled } from "@/lib/nutrition";

import { Field } from "../controls";
import { draftToNutrients, type NutrientDraft } from "./draft";
import { NutrientFields } from "./NutrientFields";

/**
 * Log something eaten or drunk: a saved food times servings, or anything typed in. With `activity`
 * the entry is linked to that workout (fueling), with the minutes into it.
 */
export function EntryForm({
  date,
  meal: fixedMeal,
  activity,
}: {
  date: string;
  /** Logs with this meal and hides the meal picker. */
  meal?: Meal;
  activity?: { source: string; source_id: string };
}) {
  const foods = useFoods();
  const { createEntry } = useNutritionMutations();
  const [meal, setMeal] = useState<Meal>(fixedMeal ?? "breakfast");
  const [foodId, setFoodId] = useState("");
  const [servings, setServings] = useState("1");
  const [name, setName] = useState("");
  const [nutrients, setNutrients] = useState<NutrientDraft>({});
  const [minutes, setMinutes] = useState("");

  const food = foods.data?.find((f) => String(f.id) === foodId);
  const count = Number(servings) > 0 ? Number(servings) : 1;
  const preview = food ? scaled(food, count) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body: EntryInput = { local_date: date, meal: fixedMeal ?? meal, servings: count };
    if (food) body.food_id = food.id;
    else Object.assign(body, { name }, draftToNutrients(nutrients));
    if (activity) {
      Object.assign(body, { activity_source: activity.source, activity_source_id: activity.source_id });
      if (minutes.trim() !== "") body.offset_s = Number(minutes) * 60;
    }
    createEntry.mutate(body, {
      onSuccess: () => {
        setServings("1");
        setName("");
        setNutrients({});
        setMinutes("");
      },
    });
  };

  return (
    <>
      <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit} aria-label="Log food or drink">
        {fixedMeal ? null : (
          <Field label="Meal">
            <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Item">
          <select value={foodId} onChange={(e) => setFoodId(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="">Type it in…</option>
            {(foods.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {foodLabel(f)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Servings">
          <input type="number" required min={0.05} step="any" value={servings} onChange={(e) => setServings(e.target.value)} style={{ width: 80 }} />
        </Field>
        {activity ? (
          <Field label="Minutes in">
            <input type="number" min={0} step="any" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: 80 }} />
          </Field>
        ) : null}
        {food ? null : (
          <>
            <Field label="Name" style={{ flex: 1, minWidth: 160 }}>
              <input type="text" required placeholder="e.g. banana" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <NutrientFields value={nutrients} onChange={setNutrients} />
          </>
        )}
        <button className="btn primary" type="submit" disabled={createEntry.isPending}>
          {createEntry.isPending ? "Saving…" : "Add"}
        </button>
      </form>
      {preview ? (
        <p className="small muted" style={{ marginBottom: 0 }}>
          Adds{" "}
          {FORM_NUTRIENTS.filter((n) => preview[n.key] !== null)
            .map((n) => `${amount(preview[n.key], n.unit)} ${n.label.toLowerCase()}`)
            .join(" · ") || "no known nutrients"}
        </p>
      ) : null}
      {createEntry.isError ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {(createEntry.error as Error).message}
        </p>
      ) : null}
    </>
  );
}
