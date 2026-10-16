import { Field } from "@/components";

import { COMPARE_PRESETS, rangeLabel } from "../lib/ranges";

export function RangeSelect({
  label,
  value,
  onChange,
  allowNone = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Offer "None" (compare against nothing). */
  allowNone?: boolean;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {COMPARE_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {rangeLabel(p.id)}
          </option>
        ))}
        {allowNone ? <option value="none">None</option> : null}
      </select>
    </Field>
  );
}
