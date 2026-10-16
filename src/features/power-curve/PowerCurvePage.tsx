import { useState } from "react";

import { useThresholds } from "@/api";
import { EmptyCard, ErrorCard, LoadingCard, PageHeader } from "@/components";
import { today } from "@/lib/dates";

import { MeanMaxCard } from "./components/MeanMaxCard";
import { PowerCurveTiles } from "./components/PowerCurveTiles";
import { RangeSelect } from "./components/RangeSelect";
import { usePowerCurveComparison } from "./hooks/usePowerCurveComparison";

/** Best average power for every duration, one range compared against another. */
export function PowerCurvePage() {
  const [a, setA] = useState("90d");
  const [b, setB] = useState("all");
  const { curveA, curveB, hasB, rows, points, labelA, labelB } = usePowerCurveComparison(a, b);
  const thresholds = useThresholds(today());

  return (
    <>
      <PageHeader
        title="Power curve"
        description="Your best average power for every duration (mean-maximal power), rides only. Tiles show the first range."
        actions={
          <div className="filters">
            <RangeSelect label="Compare" value={a} onChange={setA} />
            <RangeSelect label="Against" value={b} onChange={setB} allowNone />
          </div>
        }
      />

      {curveA.isError ? (
        <ErrorCard error={curveA.error} />
      ) : curveA.isPending ? (
        <LoadingCard />
      ) : !rows.length ? (
        <EmptyCard title="No power data in this range" />
      ) : (
        <>
          <PowerCurveTiles rows={rows} labelB={labelB} ftp={thresholds.data?.in_effect?.ftp_w ?? null} />
          <MeanMaxCard
            rows={rows}
            points={points}
            labelA={labelA}
            labelB={labelB}
            showB={hasB}
            refetching={curveA.isFetching || curveB.isFetching}
          />
        </>
      )}
    </>
  );
}
