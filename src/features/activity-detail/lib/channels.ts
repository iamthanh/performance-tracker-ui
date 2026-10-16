import type { Channel, Streams } from "@/api";
import type { Token } from "@/lib/theme";

export type ChannelSpec = { key: Channel; label: string; unit: string; token: Token; digits: number; scale?: number };

/** A stream sample: `t` (seconds from the start) and every charted channel, scaled to its display unit. */
export type StreamRow = Record<string, number | null>;

// Each channel is its own chart (different units never share an axis); identity colour is fixed per channel.
const CHANNELS: ChannelSpec[] = [
  { key: "power", label: "Power", unit: "W", token: "series-1", digits: 0 },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", token: "series-8", digits: 0 },
  { key: "cadence", label: "Cadence", unit: "rpm", token: "series-3", digits: 0 },
  { key: "speed", label: "Speed", unit: "km/h", token: "series-7", digits: 1, scale: 3.6 },
  { key: "altitude", label: "Elevation", unit: "m", token: "text-muted", digits: 0 },
];

/** The channel specs for a sport: FIT files record running cadence per leg (strides/min); watches show
 *  steps/min, twice that. */
export function channelSpecs(onFoot: boolean): ChannelSpec[] {
  return CHANNELS.map((ch) => (ch.key === "cadence" && onFoot ? { ...ch, unit: "spm", scale: 2 } : ch));
}

/** One row per sample, each channel scaled to its display unit. */
export function streamRows(streams: Streams, specs: ChannelSpec[]): StreamRow[] {
  return streams.time.map((t, i) => {
    const row: StreamRow = { t };
    for (const ch of specs) {
      const v = streams[ch.key]?.[i];
      row[ch.key] = v === null || v === undefined ? null : v * (ch.scale ?? 1);
    }
    return row;
  });
}
