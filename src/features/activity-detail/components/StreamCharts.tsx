import { useMemo } from "react";

import type { Streams } from "@/api";
import { Card, CardHeader } from "@/components";

import { useHoverIndex } from "../hooks/useHoverIndex";
import { channelSpecs, streamRows } from "../lib/channels";
import { StreamChart } from "./StreamChart";
import { StreamReadout } from "./StreamReadout";

/** Power, W′ balance, heart rate, cadence, speed and elevation, one chart each, with a shared hover readout. */
export function StreamCharts({ streams, onFoot }: { streams: Streams; onFoot: boolean }) {
  const hover = useHoverIndex();
  const specs = useMemo(() => channelSpecs(onFoot), [onFoot]);
  const channels = specs.filter((ch) => streams[ch.key]?.some((v) => v !== null));
  const rows = useMemo(() => streamRows(streams, specs), [streams, specs]);

  return (
    <Card label="Workout charts">
      <CardHeader title="Workout" subtitle="Hover a chart to read every channel at that moment" />
      <StreamReadout channels={channels} at={hover.index !== null ? rows[hover.index] : undefined} />
      {channels.map((ch, i) => (
        <StreamChart
          key={ch.key}
          channel={ch}
          rows={rows}
          showTimeAxis={i === channels.length - 1}
          onMouseMove={hover.onMouseMove}
          onMouseLeave={hover.onMouseLeave}
        />
      ))}
    </Card>
  );
}
