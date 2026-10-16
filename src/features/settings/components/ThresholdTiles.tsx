import type { Thresholds } from "@/api";
import { StatTile } from "@/components";
import { num } from "@/lib/format";

import { THRESHOLD_METRICS } from "../lib/thresholdMetrics";

/** The value of each threshold in effect today. */
export function ThresholdTiles({ inEffect }: { inEffect: Thresholds["in_effect"] }) {
  return (
    <div className="tiles">
      {THRESHOLD_METRICS.map((m) => (
        <StatTile
          key={m.value}
          label={m.short}
          value={num(inEffect?.[m.value])}
          unit={m.unit}
          hint={m.value === "resting_hr" && !inEffect?.resting_hr ? "50 assumed" : undefined}
        />
      ))}
    </div>
  );
}
