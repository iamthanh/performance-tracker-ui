import { useEffect, useState, type FormEvent } from "react";

import { useNutritionMutations, type WorkoutWeight } from "@/api";
import { Field } from "@/components";
import { fromKg, saveWeightUnit, toKg, type WeightUnit } from "@/lib/nutrition";

/** Body weight just before and just after the workout, in kg or lb (stored in kg). */
export function WeightForm({
  source,
  sourceId,
  weight,
  unit,
  onUnit,
}: {
  source: string;
  sourceId: string;
  weight: WorkoutWeight | null;
  unit: WeightUnit;
  onUnit: (unit: WeightUnit) => void;
}) {
  const { setWorkoutWeight } = useNutritionMutations();
  const show = (kg: number | null | undefined, u: WeightUnit) => (kg === null || kg === undefined ? "" : String(Math.round(fromKg(kg, u) * 10) / 10));
  const [pre, setPre] = useState(show(weight?.pre_kg, unit));
  const [post, setPost] = useState(show(weight?.post_kg, unit));
  // Saved values (or a unit switch) refill the inputs.
  useEffect(() => {
    setPre(show(weight?.pre_kg, unit));
    setPost(show(weight?.post_kg, unit));
  }, [weight?.pre_kg, weight?.post_kg, unit]);

  const kg = (text: string) => (text.trim() === "" ? null : Math.round(toKg(Number(text), unit) * 100) / 100);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!setWorkoutWeight.isPending) setWorkoutWeight.mutate({ source, id: sourceId, pre_kg: kg(pre), post_kg: kg(post) });
  };
  const range = unit === "kg" ? { min: 20, max: 300 } : { min: 45, max: 660 };
  return (
    <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit} aria-label="Body weight">
      <Field label={`Weight before (${unit})`}>
        <input type="number" step="0.1" {...range} value={pre} onChange={(e) => setPre(e.target.value)} style={{ width: 130 }} />
      </Field>
      <Field label={`Weight after (${unit})`}>
        <input type="number" step="0.1" {...range} value={post} onChange={(e) => setPost(e.target.value)} style={{ width: 130 }} />
      </Field>
      <Field label="Unit">
        <select
          value={unit}
          onChange={(e) => {
            const next = e.target.value as WeightUnit;
            saveWeightUnit(next);
            onUnit(next);
          }}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </Field>
      <button className="btn" type="submit" disabled={setWorkoutWeight.isPending}>
        {setWorkoutWeight.isPending ? "Saving…" : "Save weights"}
      </button>
      {setWorkoutWeight.isError ? (
        <span className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {(setWorkoutWeight.error as Error).message}
        </span>
      ) : setWorkoutWeight.isSuccess ? (
        <span className="small" style={{ color: "var(--success-text)" }}>
          Saved
        </span>
      ) : null}
    </form>
  );
}
