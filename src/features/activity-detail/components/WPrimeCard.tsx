import type { WPrime } from "@/api";
import { Card, CardHeader, DataTable, StatTile } from "@/components";
import { duration, num, pct } from "@/lib/format";

const kj = (j: number) => num(j / 1000, 1);

/** W' balance: the work capacity above critical power (CP) left during the ride, its low point and the
 *  "matches" burned (big withdrawals). The second-by-second balance is a chart under the power chart. */
export function WPrimeCard({ w }: { w: WPrime }) {
  const lowShare = (w.min_j / w.w_prime_j) * 100;
  return (
    <Card label="W′ balance">
      <CardHeader
        title="W′ balance"
        subtitle={
          <>
            W′ is the work you can do above critical power (CP) before you must ease off; it refills below CP.{" "}
            {w.origin === "fit"
              ? "CP and W′ are fitted to your best 3–30 minute efforts of the year up to this ride."
              : "CP is your FTP for the ride and W′ a typical 20 kJ (too few all-out efforts to fit yours)."}{" "}
            It is a model: treat the numbers as estimates.
          </>
        }
      />
      <div className="tiles" style={{ marginBottom: 12 }}>
        <StatTile label="Matches burned" value={num(w.matches.length)} hint="Drops of 2 kJ or more" />
        <StatTile label="Lowest W′" value={kj(w.min_j)} unit="kJ" hint={`${pct(lowShare, 0)} left, at ${duration(w.min_at_s)}`} />
        <StatTile label="W′" value={kj(w.w_prime_j)} unit="kJ" hint={w.origin === "fit" ? "Fitted" : "Typical default"} />
        <StatTile label="Critical power" value={num(w.cp_w)} unit="W" hint={w.origin === "fit" ? "Fitted" : "Your FTP for the ride"} />
      </div>
      {w.min_j < 0 ? (
        <p className="small muted" role="note">
          W′ went below zero: the ride did more above CP than the model allows. Either your CP and W′ are underestimated (this
          ride beat them), or you recovered faster between efforts than the model assumes, which is common in trained riders.
        </p>
      ) : null}
      {w.matches.length ? (
        <div className="table-wrap">
          <DataTable
            rows={w.matches}
            rowKey={(m) => m.start_s}
            columns={[
              { key: "n", header: "Match", cell: (_, i) => i + 1, headerClassName: "left", cellClassName: "left" },
              { key: "at", header: "At", cell: (m) => duration(m.start_s) },
              { key: "spent", header: "W′ spent", cell: (m) => `${kj(m.spent_j)} kJ` },
              { key: "low", header: "W′ left", cell: (m) => `${kj(m.low_j)} kJ (${pct((m.low_j / w.w_prime_j) * 100, 0)})` },
              { key: "took", header: "Took", cell: (m) => duration(m.low_at_s - m.start_s) },
            ]}
          />
        </div>
      ) : null}
    </Card>
  );
}
