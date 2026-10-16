import { RANGE_PRESETS, type RangePreset } from "@/lib/dates";

import { Segmented } from "./Segmented";

/** "6 weeks · 90 days · …" date-range buttons; pair with hooks/useRangePreset. */
export function RangePresetPicker({
  value,
  onChange,
  presets = RANGE_PRESETS,
}: {
  value: string;
  onChange: (id: string) => void;
  presets?: RangePreset[];
}) {
  return (
    <Segmented
      label="Date range"
      value={value}
      onChange={onChange}
      options={presets.map((p) => ({ value: p.id, label: p.label }))}
    />
  );
}
