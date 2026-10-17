import { FORM_NUTRIENTS } from "@/lib/nutrition";

import { Field } from "../controls";
import type { NutrientDraft } from "./draft";

/** One number input per nutrient the forms ask for; values are kept as typed (strings). */
export function NutrientFields({ value, onChange }: { value: NutrientDraft; onChange: (value: NutrientDraft) => void }) {
  return (
    <>
      {FORM_NUTRIENTS.map((n) => (
        <Field key={n.key} label={`${n.label} (${n.unit})`}>
          <input
            type="number"
            min={0}
            step="any"
            value={value[n.key] ?? ""}
            onChange={(e) => onChange({ ...value, [n.key]: e.target.value })}
            style={{ width: 88 }}
          />
        </Field>
      ))}
    </>
  );
}
