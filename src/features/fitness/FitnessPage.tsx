import { EmptyCard, ErrorCard, LoadingCard, PageHeader, RangePresetPicker } from "@/components";
import { useRangePreset } from "@/hooks";

import { EnergyCard } from "./components/EnergyCard";
import { FitnessFatigueCard } from "./components/FitnessFatigueCard";
import { FitnessTiles } from "./components/FitnessTiles";
import { FormCard } from "./components/FormCard";
import { UnscoredNote } from "./components/UnscoredNote";
import { WeeklyTssCard } from "./components/WeeklyTssCard";
import { useFitnessData } from "./hooks/useFitnessData";

/** Fitness, fatigue and form over a date range: TrainingPeaks' Performance Management Chart. */
export function FitnessPage() {
  const { presetId, setPresetId, preset, range } = useRangePreset("90d");
  const { load, weeks, days, points, weekRows, tick, latest, ramp, unscored } = useFitnessData(range, !!preset.all);

  return (
    <>
      <PageHeader
        title="Fitness"
        description="Fitness (CTL), fatigue (ATL) and form (TSB) from daily training stress, like the Performance Management Chart."
        actions={<RangePresetPicker value={presetId} onChange={setPresetId} />}
      />

      {load.isError ? (
        <ErrorCard error={load.error} />
      ) : load.isPending ? (
        <LoadingCard />
      ) : !latest ? (
        <EmptyCard title="No training stress yet">
          Import your Strava export with <code>fitness-hub import-strava-export</code>; the analysis runs at the end.
        </EmptyCard>
      ) : (
        <>
          <FitnessTiles days={days} latest={latest} ramp={ramp} />
          <UnscoredNote count={unscored} />
          <FitnessFatigueCard days={days} points={points} tick={tick} refetching={load.isFetching} />
          <FormCard days={days} points={points} tick={tick} refetching={load.isFetching} />
          <WeeklyTssCard
            weeks={weekRows}
            error={weeks.isError ? weeks.error : null}
            tick={tick}
            refetching={weeks.isFetching}
          />
          <EnergyCard start={days[0]!.date} end={range.end} tick={tick} />
        </>
      )}
    </>
  );
}
