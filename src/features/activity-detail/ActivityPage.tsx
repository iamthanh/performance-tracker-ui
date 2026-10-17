import { useState } from "react";
import { useParams } from "react-router-dom";

import { ApiError, useActivity, useInsights, useRideCardio, useStreams } from "@/api";
import { ErrorCard, LoadingCard } from "@/components";
import { num } from "@/lib/format";

import { ActivityHeader } from "./components/ActivityHeader";
import { ActivityTiles } from "./components/ActivityTiles";
import { BestEffortsCard } from "./components/BestEffortsCard";
import { DurabilityCard } from "./components/DurabilityCard";
import { EffortsCard } from "./components/EffortsCard";
import { FuelingCard } from "./components/FuelingCard";
import { HeartRatePowerCard } from "./components/HeartRatePowerCard";
import { LapsTable } from "./components/LapsTable";
import { PeakPowerCard } from "./components/PeakPowerCard";
import { RouteCard } from "./components/RouteCard";
import { StreamsSection } from "./components/StreamsSection";
import { WPrimeCard } from "./components/WPrimeCard";
import { ZoneCard } from "./components/ZoneCard";
import type { Highlight } from "./lib/highlight";
import { wkgHeader } from "./lib/insights";
import { isOnFoot } from "./lib/sport";

/** One workout's analysis: headline numbers, per-second charts, zones, peak power, heart rate against power,
 *  durability, W′ balance, efforts, route, fueling and laps. */
export function ActivityPage() {
  const { source = "", id = "" } = useParams();
  const detail = useActivity(source, id);
  const hasStreams = !!detail.data?.streams;
  const streams = useStreams(source, id, hasStreams);
  const insights = useInsights(source, id);
  const cardio = useRideCardio(source, id); // 404 for a workout without power and heart rate: no card
  // Kept with the activity it belongs to, so it never shows on the next one (the route reuses this page).
  const [mark, setMark] = useState<{ activity: string; highlight: Highlight } | null>(null);
  const activityKey = `${source}/${id}`;
  const highlight = mark?.activity === activityKey ? mark.highlight : null;
  const setHighlight = (h: Highlight | null) => setMark(h ? { activity: activityKey, highlight: h } : null);

  if (detail.isError) return <ErrorCard error={detail.error} />;
  if (detail.isPending) return <LoadingCard />;

  const d = detail.data;
  const m = d.analysis;
  const ins = insights.data;
  const kg = ins?.weight?.kg ?? null;
  const wkg = wkgHeader(ins?.weight); // "W/kg (estimated)" when the weight was not weighed that day
  return (
    <>
      <ActivityHeader detail={d} />
      <ActivityTiles detail={d} weight={ins?.weight ?? null} />
      <StreamsSection
        hasStreams={hasStreams}
        streams={streams}
        onFoot={isOnFoot(d.activity.sport)}
        highlight={highlight}
        onClearHighlight={() => setHighlight(null)}
      />
      {/* Right under the charts, where picking a row marks the stretch. */}
      {ins?.best_efforts?.length ? (
        <BestEffortsCard
          efforts={ins.best_efforts}
          kg={kg}
          wkg={wkg}
          selected={highlight}
          onSelect={(h) => {
            setHighlight(h);
            if (h) showMarkedStretch();
          }}
        />
      ) : null}
      <div className="grid two">
        {m?.power_zones ? <ZoneCard title="Time in power zones" zones={m.power_zones} unit="W" threshold={`FTP ${num(m.ftp_w)} W`} /> : null}
        {m?.hr_zones ? (
          <ZoneCard title="Time in heart-rate zones" zones={m.hr_zones} unit="bpm" threshold={`Threshold ${num(m.threshold_hr)} bpm`} />
        ) : null}
        {m && m.power_curve.length ? <PeakPowerCard detail={d} kg={kg} wkg={wkg} /> : null}
        {streams.data?.lat && streams.data.lng ? <RouteCard lat={streams.data.lat} lng={streams.data.lng} /> : null}
      </div>
      {/* Rides only: a run with power is not on the cycling scale (the API sends no ride for it). */}
      {cardio.data?.ride ? <HeartRatePowerCard data={cardio.data} /> : null}
      {cardio.isError && !(cardio.error instanceof ApiError && cardio.error.status === 404) ? <ErrorCard error={cardio.error} /> : null}
      {/* Full width: six durations in the table, a duration picker in the header. */}
      {ins?.durability ? <DurabilityCard durability={ins.durability} weight={ins.weight} /> : null}
      {ins?.w_prime ? <WPrimeCard w={ins.w_prime} /> : null}
      {ins?.efforts ? <EffortsCard efforts={ins.efforts} kg={kg} wkg={wkg} /> : null}
      <FuelingCard source={d.activity.source} sourceId={d.activity.source_id} date={d.activity.local_date} />
      {d.laps.length > 1 ? <LapsTable laps={d.laps} running={d.activity.sport === "running"} /> : null}
    </>
  );
}

/** Scroll the charts (top of the page) into view and move focus to the mark's clear button there. */
function showMarkedStretch() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.querySelector('[aria-label="Workout charts"]')?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[aria-label="Clear the marked stretch"]')?.focus({ preventScroll: true }));
}
