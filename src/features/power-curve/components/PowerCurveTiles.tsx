import { StatTile } from "@/components";
import { durationLabel, isNum, num } from "@/lib/format";

import { KEY_DURATIONS } from "../lib/ranges";
import type { CurveRow } from "../lib/types";

/** Best power at key durations in the first range (the second range in the hint), and the FTP in effect. */
export function PowerCurveTiles({ rows, labelB, ftp }: { rows: CurveRow[]; labelB: string; ftp: number | null }) {
  return (
    <div className="tiles">
      {KEY_DURATIONS.map((d) => {
        const row = rows.find((r) => r.d === d);
        const best = row?.a?.watts;
        const other = row?.b?.watts;
        return (
          <StatTile
            key={d}
            label={`Best ${durationLabel(d)}`}
            value={num(best)}
            unit="W"
            hint={isNum(other) ? `${labelB}: ${num(other)} W` : undefined}
          />
        );
      })}
      <StatTile label="FTP in effect" value={num(ftp)} unit="W" hint="95% of best 20 min, or your setting" />
    </div>
  );
}
