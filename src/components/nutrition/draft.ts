import type { NutrientKey } from "@/api";
import { FORM_NUTRIENTS } from "@/lib/nutrition";

/** Nutrient inputs as typed (strings; "" = unknown). */
export type NutrientDraft = Partial<Record<NutrientKey, string>>;

/** The typed values as numbers, leaving out empty fields (unknown). */
export function draftToNutrients(draft: NutrientDraft): Partial<Record<NutrientKey, number>> {
  const out: Partial<Record<NutrientKey, number>> = {};
  for (const [key, text] of Object.entries(draft)) {
    if (text !== undefined && text.trim() !== "") out[key as NutrientKey] = Number(text);
  }
  return out;
}

/** Stored values as form text ("" for unknown). */
export function nutrientsToDraft(values: Partial<Record<NutrientKey, number | null>>): NutrientDraft {
  return Object.fromEntries(FORM_NUTRIENTS.map((n) => [n.key, values[n.key] === null || values[n.key] === undefined ? "" : String(values[n.key])]));
}
