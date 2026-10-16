import type { Sport } from "@/api";

/** Running, walking and hiking: cadence is recorded per leg and shown as steps per minute. */
export function isOnFoot(sport: Sport | null | undefined): boolean {
  return sport === "running" || sport === "walking" || sport === "hiking";
}
