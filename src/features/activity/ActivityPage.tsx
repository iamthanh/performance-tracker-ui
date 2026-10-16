import { useParams } from "react-router-dom";

import { useActivity, useStreams } from "@/api";
import { ErrorCard, LoadingCard } from "@/components";
import { num } from "@/lib/format";

import { ActivityHeader } from "./components/ActivityHeader";
import { ActivityTiles } from "./components/ActivityTiles";
import { LapsTable } from "./components/LapsTable";
import { PeakPowerCard } from "./components/PeakPowerCard";
import { RouteCard } from "./components/RouteCard";
import { StreamsSection } from "./components/StreamsSection";
import { ZoneCard } from "./components/ZoneCard";
import { isOnFoot } from "./lib/sport";

/** One workout's analysis: headline numbers, per-second charts, zones, peak power, route and laps. */
export function ActivityPage() {
  const { source = "", id = "" } = useParams();
  const detail = useActivity(source, id);
  const hasStreams = !!detail.data?.streams;
  const streams = useStreams(source, id, hasStreams);

  if (detail.isError) return <ErrorCard error={detail.error} />;
  if (detail.isPending) return <LoadingCard />;

  const d = detail.data;
  const m = d.analysis;
  return (
    <>
      <ActivityHeader detail={d} />
      <ActivityTiles detail={d} />
      <StreamsSection hasStreams={hasStreams} streams={streams} onFoot={isOnFoot(d.activity.sport)} />
      <div className="grid two">
        {m?.power_zones ? <ZoneCard title="Time in power zones" zones={m.power_zones} unit="W" threshold={`FTP ${num(m.ftp_w)} W`} /> : null}
        {m?.hr_zones ? (
          <ZoneCard title="Time in heart-rate zones" zones={m.hr_zones} unit="bpm" threshold={`Threshold ${num(m.threshold_hr)} bpm`} />
        ) : null}
        {m && m.power_curve.length ? <PeakPowerCard detail={d} /> : null}
        {streams.data?.lat && streams.data.lng ? <RouteCard lat={streams.data.lat} lng={streams.data.lng} /> : null}
      </div>
      {d.laps.length > 1 ? <LapsTable laps={d.laps} running={d.activity.sport === "running"} /> : null}
    </>
  );
}
