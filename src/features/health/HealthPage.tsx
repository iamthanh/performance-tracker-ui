import { ChartCard, DailyLineChart, EmptyCard, ErrorCard, LoadingCard, PageHeader, RangePresetPicker } from "@/components";
import { useRangePreset } from "@/hooks";

import { DayHeartRateCard } from "./components/DayHeartRateCard";
import { HealthTiles } from "./components/HealthTiles";
import { MetricCard } from "./components/MetricCard";
import { SleepCard } from "./components/SleepCard";
import { useHealthData } from "./hooks/useHealthData";
import { HEALTH_PRESETS } from "./lib/series";

/** Recovery markers (resting HR, HRV, sleep, weight) next to training form. */
export function HealthPage() {
  const { presetId, setPresetId, range } = useRangePreset("90d", HEALTH_PRESETS);
  const health = useHealthData(range);

  if (health.failed) return <ErrorCard error={health.failed.error} />;

  return (
    <>
      <PageHeader
        title="Health"
        description="Recovery markers from your watch next to your training load."
        actions={<RangePresetPicker value={presetId} onChange={setPresetId} presets={HEALTH_PRESETS} />}
      />

      {health.loading ? (
        <LoadingCard />
      ) : health.empty ? (
        <EmptyCard title="No health data in this range">
          Connect Garmin for resting heart rate, HRV, sleep and all-day heart rate: in the backend repo run{" "}
          <code>fitness-hub auth garmin</code>, then <code>fitness-hub sync --source garmin</code>.
        </EmptyCard>
      ) : (
        <>
          <HealthTiles
            end={range.end}
            resting={health.resting}
            hrv={health.hrv}
            sleepScore={health.sleepScore}
            nights={health.nights}
            weight={health.weight}
          />

          <ChartCard
            title="Form"
            subtitle="Training stress balance, for context: recovery markers usually worsen when form is low"
            refetching={health.load.isFetching}
          >
            <DailyLineChart data={health.form} token="series-1" unit="" zero syncId="health" />
          </ChartCard>
          <div className="grid two">
            <MetricCard title="Resting heart rate" unit="bpm" data={health.resting} token="series-8" />
            <MetricCard title="Heart-rate variability" unit="ms" data={health.hrv} token="series-7" subtitle="Nightly RMSSD" />
          </div>

          <SleepCard nights={health.nights} refetching={health.sleep.isFetching} />

          <div className="grid two">
            <MetricCard title="Weight" unit="kg" data={health.weight} token="series-1" digits={1} />
            <DayHeartRateCard />
          </div>
        </>
      )}
    </>
  );
}
