import { useState, type FormEvent } from "react";

import { useFoods, useNutritionMutations, type Food } from "@/api";
import { Card, CardHeader, DataTable, draftToNutrients, Empty, Field, NutrientFields, nutrientsToDraft, type NutrientDraft } from "@/components";
import { num } from "@/lib/format";

/** Saved foods: add, edit and delete. Logged entries keep their own copy of the nutrients. */
export function FoodsCard() {
  const foods = useFoods();
  const { createFood, updateFood, deleteFood } = useNutritionMutations();
  const [editing, setEditing] = useState<Food | null>(null);
  const [name, setName] = useState("");
  const [serving, setServing] = useState("");
  const [nutrients, setNutrients] = useState<NutrientDraft>({});

  const reset = () => {
    setEditing(null);
    setName("");
    setServing("");
    setNutrients({});
  };
  const edit = (food: Food) => {
    setEditing(food);
    setName(food.name);
    setServing(food.serving ?? "");
    setNutrients(nutrientsToDraft(food));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Nutrients the form does not show (sugars, fibre, potassium) are kept as they were.
    const kept = editing ? { sugars_g: editing.sugars_g, fiber_g: editing.fiber_g, potassium_mg: editing.potassium_mg } : {};
    const body = { ...kept, name, serving: serving || null, brand: editing?.brand ?? null, note: editing?.note ?? null, ...draftToNutrients(nutrients) };
    if (editing) updateFood.mutate({ id: editing.id, body }, { onSuccess: reset });
    else createFood.mutate(body, { onSuccess: reset });
  };
  const saving = createFood.isPending || updateFood.isPending;
  const error = createFood.error ?? updateFood.error ?? deleteFood.error;

  return (
    <Card label="Saved foods">
      <CardHeader title="Saved foods" subtitle="Nutrients per serving, for logging in one tap: gels, bottles, your usual breakfast." />
      <form className="filters" style={{ alignItems: "flex-end" }} onSubmit={submit} aria-label={editing ? "Edit food" : "Save a food"}>
        <Field label="Name" style={{ flex: 1, minWidth: 160 }}>
          <input type="text" required placeholder="e.g. Maurten Gel 100" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="One serving is">
          <input type="text" placeholder="e.g. 1 gel (40 g)" value={serving} onChange={(e) => setServing(e.target.value)} />
        </Field>
        <NutrientFields value={nutrients} onChange={setNutrients} />
        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Save food"}
        </button>
        {editing ? (
          <button className="btn" type="button" onClick={reset}>
            Cancel
          </button>
        ) : null}
      </form>
      {error ? (
        <p className="small" role="alert" style={{ color: "var(--critical-text)" }}>
          {(error as Error).message}
        </p>
      ) : null}
      <div className="table-wrap" style={{ marginTop: 12 }}>
        {foods.data?.length ? (
          <DataTable
            rows={foods.data}
            rowKey={(f) => f.id}
            columns={[
              { key: "name", header: "Food", cell: (f) => f.name },
              { key: "serving", header: "Serving", headerClassName: "left", cellClassName: "left secondary", cell: (f) => f.serving },
              { key: "kcal", header: "kcal", cell: (f) => num(f.kcal) },
              { key: "carbs", header: "Carbs (g)", cell: (f) => num(f.carbs_g) },
              { key: "protein", header: "Protein (g)", cell: (f) => num(f.protein_g) },
              { key: "fat", header: "Fat (g)", cell: (f) => num(f.fat_g) },
              { key: "fluid", header: "Fluid (ml)", cell: (f) => num(f.fluid_ml) },
              { key: "sodium", header: "Sodium (mg)", cell: (f) => num(f.sodium_mg) },
              { key: "caffeine", header: "Caffeine (mg)", cell: (f) => num(f.caffeine_mg) },
              {
                key: "actions",
                header: null,
                cell: (f) => (
                  <>
                    <button type="button" className="btn ghost small" onClick={() => edit(f)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      disabled={deleteFood.isPending}
                      onClick={() => window.confirm(`Delete ${f.name}? Entries already logged keep their nutrients.`) && deleteFood.mutate(f.id)}
                    >
                      Delete
                    </button>
                  </>
                ),
              },
            ]}
          />
        ) : foods.isPending ? null : (
          <Empty title="No saved foods yet" />
        )}
      </div>
    </Card>
  );
}
