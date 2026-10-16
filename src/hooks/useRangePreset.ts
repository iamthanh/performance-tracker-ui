import { useState } from "react";

import { presetRange, RANGE_PRESETS, type RangePreset } from "@/lib/dates";

/** A date-range preset picked by id (e.g. "90d"), and the dates it covers, ending today. */
export function useRangePreset(initialId: string, presets: RangePreset[] = RANGE_PRESETS) {
  const [presetId, setPresetId] = useState(initialId);
  const preset = presets.find((p) => p.id === presetId)!;
  return { presetId, setPresetId, preset, range: presetRange(preset) };
}
