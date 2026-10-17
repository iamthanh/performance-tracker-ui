import { useState, type FormEvent } from "react";

import { useNutritionMutations, type DrinkRecipe } from "@/api";
import { num } from "@/lib/format";
import { bottleTotals, glucoseFructose } from "@/lib/nutrition";

import { Field } from "../controls";
import { emptyBottle, loadLastBottle, saveLastBottle, type BottleDraft } from "./bottleDraft";

const NUMBER = { type: "number", min: 0, step: "any" } as const;
const MAX_OTHER = 20; // as the API allows

/** Log bottles drunk during a workout: how many, and what one bottle holds. The last recipe is remembered. */
export function DrinkForm({ date, activity }: { date: string; activity: { source: string; source_id: string } }) {
  const { createEntry } = useNutritionMutations();
  const [draft, setDraft] = useState<BottleDraft>(loadLastBottle);
  const [bottles, setBottles] = useState("1");
  const [minutes, setMinutes] = useState("");
  const set = (change: Partial<BottleDraft>) => setDraft((d) => ({ ...d, ...change }));
  const setOther = (i: number, change: Partial<BottleDraft["other"][number]>) =>
    set({ other: draft.other.map((o, j) => (j === i ? { ...o, ...change } : o)) });

  const n = (text: string) => (text.trim() === "" ? null : Number(text));
  const recipe: DrinkRecipe = {
    water_ml: n(draft.water_ml),
    salt_g: n(draft.salt_g),
    maltodextrin_g: n(draft.maltodextrin_g),
    sucrose_g: n(draft.sucrose_g),
    other: draft.other
      .filter((o) => o.name.trim())
      .map((o) => ({ name: o.name.trim(), grams: n(o.grams), carbs_g: n(o.carbs_g), sodium_mg: n(o.sodium_mg), caffeine_mg: n(o.caffeine_mg) })),
  };
  const count = Number(bottles) > 0 ? Number(bottles) : 1;
  const totals = bottleTotals(recipe, count);
  const ratio = glucoseFructose(totals.glucose_g, totals.fructose_g);
  const empty = !recipe.water_ml && !recipe.salt_g && !recipe.maltodextrin_g && !recipe.sucrose_g && !recipe.other.length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (createEntry.isPending || empty) return;
    createEntry.mutate(
      {
        local_date: date,
        meal: "during_workout",
        activity_source: activity.source,
        activity_source_id: activity.source_id,
        ...(minutes.trim() !== "" ? { offset_s: Math.round(Number(minutes) * 60) } : {}),
        drink: { bottles: count, ...recipe },
      },
      {
        onSuccess: () => {
          saveLastBottle(draft);
          setBottles("1");
          setMinutes("");
        },
      },
    );
  };

  return (
    <form onSubmit={submit} aria-label="Log bottles" className="drink-form">
      <div className="filters" style={{ alignItems: "flex-end" }}>
        <Field label="Bottles">
          <input {...NUMBER} min={0.25} max={50} required value={bottles} onChange={(e) => setBottles(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Water (ml/bottle)">
          <input {...NUMBER} value={draft.water_ml} onChange={(e) => set({ water_ml: e.target.value })} style={{ width: 120 }} />
        </Field>
        <Field label="Salt (g/bottle)">
          <input {...NUMBER} value={draft.salt_g} onChange={(e) => set({ salt_g: e.target.value })} style={{ width: 110 }} />
        </Field>
        <Field label="Maltodextrin (g/bottle)">
          <input {...NUMBER} value={draft.maltodextrin_g} onChange={(e) => set({ maltodextrin_g: e.target.value })} style={{ width: 150 }} />
        </Field>
        <Field label="Sucrose (g/bottle)">
          <input {...NUMBER} value={draft.sucrose_g} onChange={(e) => set({ sucrose_g: e.target.value })} style={{ width: 120 }} />
        </Field>
        <Field label="Minutes in">
          <input {...NUMBER} value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: 80 }} />
        </Field>
        <button className="btn primary" type="submit" disabled={createEntry.isPending || empty}>
          {createEntry.isPending ? "Saving…" : count === 1 ? "Add bottle" : `Add ${num(count, count % 1 ? 1 : 0)} bottles`}
        </button>
      </div>
      {draft.other.map((o, i) => (
        <div className="filters drink-other" style={{ alignItems: "flex-end" }} key={i} role="group" aria-label={`Other ingredient ${i + 1}`}>
          <Field label={draft.other.length > 1 ? `Other ingredient ${i + 1}` : "Other ingredient"} style={{ flex: 1, minWidth: 160 }}>
            <input type="text" required maxLength={100} placeholder="e.g. sodium citrate" value={o.name} onChange={(e) => setOther(i, { name: e.target.value })} />
          </Field>
          <Field label="Amount (g/bottle)">
            <input {...NUMBER} value={o.grams} onChange={(e) => setOther(i, { grams: e.target.value })} style={{ width: 120 }} />
          </Field>
          <Field label="Carbs (g/bottle)">
            <input {...NUMBER} value={o.carbs_g} onChange={(e) => setOther(i, { carbs_g: e.target.value })} style={{ width: 110 }} />
          </Field>
          <Field label="Sodium (mg/bottle)">
            <input {...NUMBER} value={o.sodium_mg} onChange={(e) => setOther(i, { sodium_mg: e.target.value })} style={{ width: 120 }} />
          </Field>
          <Field label="Caffeine (mg/bottle)">
            <input {...NUMBER} value={o.caffeine_mg} onChange={(e) => setOther(i, { caffeine_mg: e.target.value })} style={{ width: 130 }} />
          </Field>
          <button type="button" className="btn ghost small" onClick={() => set({ other: draft.other.filter((_, j) => j !== i) })} aria-label={`Remove ${o.name || "ingredient"}`}>
            Remove
          </button>
        </div>
      ))}
      <div className="filters" style={{ justifyContent: "space-between" }}>
        {draft.other.length < MAX_OTHER ? (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => set({ other: [...draft.other, { name: "", grams: "", carbs_g: "", sodium_mg: "", caffeine_mg: "" }] })}
          >
            + Other ingredient
          </button>
        ) : (
          <span className="small muted">Up to {MAX_OTHER} other ingredients</span>
        )}
        <button type="button" className="btn ghost small" onClick={() => setDraft(emptyBottle())}>
          Clear recipe
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }} aria-live="polite">
        {empty
          ? "Enter what one bottle holds; the last recipe you used is filled in next time."
          : `${num(count, count % 1 ? 1 : 0)} × bottle: ${num(totals.fluid_ml)} ml · ${num(totals.carbs_g)} g carbs${ratio ? ` (glucose : fructose ${ratio})` : ""} · ${num(totals.sodium_mg)} mg sodium${totals.caffeine_mg ? ` · ${num(totals.caffeine_mg)} mg caffeine` : ""} · ${num(totals.kcal)} kcal`}
      </p>
      {createEntry.isError ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)", margin: 0 }}>
          {(createEntry.error as Error).message}
        </p>
      ) : null}
    </form>
  );
}
