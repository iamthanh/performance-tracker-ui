import type { BestPower } from "@/api";

/** One duration with the best effort in each compared range. */
export type CurveRow = { d: number; a: BestPower | null; b: BestPower | null };

/** A charted duration: the watts of each range. */
export type CurveChartPoint = { d: number; a: number | null; b: number | null };
