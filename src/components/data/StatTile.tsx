import type { ReactNode } from "react";

/** One headline number: label, value with unit, and an optional hint below. `hero` makes it larger. */
export function StatTile({
  label,
  value,
  unit,
  hint,
  hero = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={hero ? "tile hero" : "tile"}>
      <div className="label" title={label}>
        {label}
      </div>
      <div className="value">
        {value}
        {unit && value !== "—" ? <small>{unit}</small> : null}
      </div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
