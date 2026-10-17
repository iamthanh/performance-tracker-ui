// Cardio index helpers shared by the Fitness page and the ride page.

import type { CardioModel, CardioRide } from "@/api";

import { signed } from "./format";

/** What the conditions added to a ride's heart rate, in words: ["indoors −5.3 bpm", "heat +1.8 bpm (28 °C)"]. */
export function correctionParts(ride: Pick<CardioRide, "corrections" | "temp_c" | "tsb">): string[] {
  const bpm = (v: number) => `${signed(v, 1)} bpm`;
  const parts: string[] = [];
  if (Math.abs(ride.corrections.indoor) >= 0.05) parts.push(`indoors ${bpm(ride.corrections.indoor)}`);
  if (Math.abs(ride.corrections.heat) >= 0.05) parts.push(`heat ${bpm(ride.corrections.heat)}${ride.temp_c !== null ? ` (${Math.round(ride.temp_c)} °C)` : ""}`);
  if (Math.abs(ride.corrections.form) >= 0.05) {
    const state = ride.tsb < 0 ? "tired" : "fresh";
    parts.push(`${state} ${bpm(ride.corrections.form)} (TSB ${signed(ride.tsb, 0)})`);
  }
  return parts;
}

/** A heart-rate difference at the reference power as watts at the reference heart rate (fewer beats = more watts). */
export function bpmAsWatts(bpm: number, model: Pick<CardioModel, "slope_bpm_per_w">): number {
  return -bpm / model.slope_bpm_per_w;
}
