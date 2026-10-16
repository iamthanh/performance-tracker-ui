import type { Zone } from "@/api";

export type ZoneRow = Zone & { range: string; share: number };

/** Each zone with its range ("142–155 bpm", the last open-ended) and share of the total time in %. */
export function zoneRows(zones: Zone[], unit: string): ZoneRow[] {
  const total = zones.reduce((t, z) => t + z.seconds, 0) || 1;
  return zones.map((z, i) => {
    const lower = i === 0 ? 0 : (zones[i - 1]!.upper ?? 0) + 1;
    const range = z.upper === null ? `${lower}+ ${unit}` : `${lower}–${z.upper} ${unit}`;
    return { ...z, range, share: (z.seconds / total) * 100 };
  });
}
