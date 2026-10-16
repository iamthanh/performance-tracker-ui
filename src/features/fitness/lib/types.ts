import type { LoadDay } from "@/api";

/** A training-load day as charted: `tssDot` is null on rest days so no dot is drawn. */
export type LoadPoint = LoadDay & { tssDot: number | null };

/** Formats a date for the x-axis (days or months, by the span shown). */
export type DateTick = (iso: string) => string;
