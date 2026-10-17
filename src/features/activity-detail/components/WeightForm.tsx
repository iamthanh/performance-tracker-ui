import { useEffect, useState, type FormEvent } from "react";

import { useNutritionMutations, type WorkoutWeight } from "@/api";
import { Field } from "@/components";
import { fromKg, saveWeightUnit, toKg, type WeightUnit } from "@/lib/nutrition";

/** A weight in `unit` for an input: up to two decimals, no trailing zeros ("" when unknown). */
const show = (kg: number | null | undefined, unit: WeightUnit) =>
  kg === null || kg === undefined ? "" : String(Math.round(fromKg(kg, unit) * 100) / 100);

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
  const [pre, setPre] = useState(show(weight?.pre_kg, unit));
  const [post, setPost] = useState(show(weight?.post_kg, unit));
  // Only a newly saved value refills the inputs, so typing in one field is never overwritten.
  useEffect(() => {
    setPre(show(weight?.pre_kg, unit));
    setPost(show(weight?.post_kg, unit));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the unit is handled by switchUnit
  }, [weight?.updated_at]);

  const kg = (text: string, u = unit) => (text.trim() === "" ? null : Math.round(toKg(Number(text), u) * 100) / 100);
  const edited = (set: (v: string) => void) => (v: string) => {
    set(v);
    setWorkoutWeight.reset(); // a stale "Saved" would be misleading
  };
  // A unit switch converts what is in the fields, typed or saved.
  const switchUnit = (next: WeightUnit) => {
    const convert = (text: string) => show(kg(text), next);
    setPre(convert(pre));
    setPost(convert(post));
    saveWeightUnit(next);
    onUnit(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!setWorkoutWeight.isPending) setWorkoutWeight.mutate({ source, id: sourceId, pre_kg: kg(pre), post_kg: kg(post) });
  };
  const range = unit === "kg" ? { min: 20, max: 300 } : { min: 45, max: 660 };
  return (
    <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit} aria-label="Body weight">
      <Field label={`Weight before (${unit})`}>
        <input type="number" step="any" {...range} value={pre} onChange={(e) => edited(setPre)(e.target.value)} style={{ width: 130 }} />
      </Field>
      <Field label={`Weight after (${unit})`}>
        <input type="number" step="any" {...range} value={post} onChange={(e) => edited(setPost)(e.target.value)} style={{ width: 130 }} />
      </Field>
      <Field label="Unit">
        <select
          value={unit}
          onChange={(e) => switchUnit(e.target.value as WeightUnit)}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </Field>
      <button className="btn" type="submit" disabled={setWorkoutWeight.isPending}>
        {setWorkoutWeight.isPending ? "Saving…" : "Save weights"}
      </button>
      <span aria-live="polite">
        {setWorkoutWeight.isError ? (
          <span className="small" role="alert" style={{ color: "var(--critical-text)" }}>
            {(setWorkoutWeight.error as Error).message}
          </span>
        ) : setWorkoutWeight.isSuccess ? (
          <span className="small" style={{ color: "var(--success-text)" }}>
            Saved
          </span>
        ) : null}
      </span>
    </form>
  );
}
