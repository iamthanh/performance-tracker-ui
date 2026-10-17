import { CARDIO_SCORED, type CardioScored, type CardioSettings, type CardioWeights } from "@/api";

export type CardioDraft = Record<CardioScored, string> & { power: string; hr: string };

export const CARDIO_LABELS: Record<CardioScored, string> = {
  aerobic: "Aerobic efficiency",
  resting_hr: "Resting heart rate",
  hr_recovery: "HR recovery",
};

/** The form's text values from saved settings (an automatic reference is an empty field). */
export function toCardioDraft(settings: CardioSettings): CardioDraft {
  const draft = Object.fromEntries(CARDIO_SCORED.map((k) => [k, String(settings.weights[k])])) as CardioDraft;
  draft.power = settings.reference_power_w === null ? "" : String(settings.reference_power_w);
  draft.hr = settings.reference_hr_bpm === null ? "" : String(settings.reference_hr_bpm);
  return draft;
}

/** The settings to save, or what is wrong with the form. */
export function fromCardioDraft(
  draft: CardioDraft,
): { weights: CardioWeights; reference_power_w: number | null; reference_hr_bpm: number | null } | { error: string } {
  const weights = {} as CardioWeights;
  for (const k of CARDIO_SCORED) {
    const v = Number(draft[k]);
    if (draft[k].trim() === "" || !Number.isFinite(v) || v < 0 || v > 100) return { error: `${CARDIO_LABELS[k]}: a weight from 0 to 100` };
    weights[k] = v;
  }
  if (!(weights.aerobic > 0)) return { error: "Aerobic efficiency must weigh more than 0: the score rests on it" };
  const reference = (text: string, low: number, high: number, name: string): number | null | { error: string } => {
    if (text.trim() === "") return null;
    const v = Number(text);
    return Number.isFinite(v) && v >= low && v <= high ? v : { error: `${name}: ${low} to ${high}, or empty for automatic` };
  };
  const power = reference(draft.power, 50, 600, "Reference power");
  if (power !== null && typeof power === "object") return power;
  const hr = reference(draft.hr, 60, 220, "Reference heart rate");
  if (hr !== null && typeof hr === "object") return hr;
  return { weights, reference_power_w: power, reference_hr_bpm: hr };
}
