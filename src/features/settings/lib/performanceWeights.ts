import { PERFORMANCE_COMPONENTS, type PerformanceComponent, type PerformanceWeights } from "@/api";

export type WeightsDraft = Record<PerformanceComponent, string> & { decay: string };

export const COMPONENT_LABELS: Record<PerformanceComponent, string> = {
  sprint: "Sprint (5 s)",
  anaerobic: "Anaerobic (1 min)",
  vo2max: "VO2max (5 min)",
  threshold: "Threshold",
  endurance: "Endurance (60 min)",
  durability: "Durability",
};

/** The form's text values from saved settings (decay shown in % per week). */
export function toDraft(weights: PerformanceWeights, decayPerWeek: number): WeightsDraft {
  const draft = Object.fromEntries(PERFORMANCE_COMPONENTS.map((k) => [k, String(weights[k])])) as WeightsDraft;
  draft.decay = String(Math.round(decayPerWeek * 1000) / 10);
  return draft;
}

/** The settings to save, or what is wrong with the form. */
export function fromDraft(draft: WeightsDraft): { weights: PerformanceWeights; decay_per_week: number } | { error: string } {
  const weights = {} as PerformanceWeights;
  for (const k of PERFORMANCE_COMPONENTS) {
    const v = Number(draft[k]);
    if (draft[k].trim() === "" || !Number.isFinite(v) || v < 0 || v > 100) return { error: `${COMPONENT_LABELS[k]}: a weight from 0 to 100` };
    weights[k] = v;
  }
  if (!Object.values(weights).some((v) => v > 0)) return { error: "At least one weight must be above 0" };
  const decay = Number(draft.decay);
  if (draft.decay.trim() === "" || !Number.isFinite(decay) || decay < 0 || decay > 5) return { error: "Easing: 0 to 5 % a week" };
  return { weights, decay_per_week: decay / 100 };
}
